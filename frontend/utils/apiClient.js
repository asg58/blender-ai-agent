const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const BLENDER_WS_URL = process.env.NEXT_PUBLIC_BLENDER_WS_URL || 'ws://localhost:9876';

// Fallback mode for when backend is not available
let FALLBACK_MODE = false;

class ApiClient {
  constructor() {
    this.websocket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.onConnectionChange = null;  // Event handler for connection changes
    this.onSceneUpdate = null;       // Event handler for scene updates
    this.onError = null;             // Event handler for errors
    this._pendingResponses = {};
    this._wsMessageHandlerAdded = false;
  }

  async sendCommand(command) {
    if (!command) {
      throw new Error('Command cannot be empty');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/agent/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });

      let data;
      // Try to parse as JSON, but handle non-JSON responses
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        if (!response.ok) {
          throw new Error(`Failed to process command: ${text}`);
        }
        return { message: text };
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to process command');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      if (this.onError) this.onError(error);
      throw error;
    }
  }

  async executeBlenderCommand(code) {
    if (!code) {
      throw new Error('Code cannot be empty');
    }

    if (!this.isConnected) {
      throw new Error('Not connected to Blender');
    }

    try {
      // Check if we should use fallback mode
      if (!FALLBACK_MODE) {
        await this.testBackendConnection();
      }

      // In fallback mode or if backend is down, use WebSocket directly
      if (FALLBACK_MODE && this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        console.log("Using direct WebSocket connection for code execution");
        // Generate a unique ID for this request
        const requestId = Math.random().toString(36).substring(2, 15);
        
        // Create a promise that will resolve when we get a response
        const responsePromise = new Promise((resolve, reject) => {
          // Set up a timeout
          const timeout = setTimeout(() => {
            delete this._pendingResponses[requestId];
            reject(new Error('WebSocket request timed out'));
          }, 5000);
          
          // Store the resolve and reject functions
          this._pendingResponses = this._pendingResponses || {};
          this._pendingResponses[requestId] = { resolve, reject, timeout };
        });
        
        // Set up a message handler if not already done
        if (!this._wsMessageHandlerAdded) {
          const originalOnMessage = this.websocket.onmessage;
          this.websocket.onmessage = (event) => {
            if (originalOnMessage) originalOnMessage(event);
            
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'code_executed' && data.requestId && this._pendingResponses[data.requestId]) {
                const { resolve, timeout } = this._pendingResponses[data.requestId];
                clearTimeout(timeout);
                delete this._pendingResponses[data.requestId];
                resolve(data.result);
              }
            } catch (error) {
              console.error('Error handling WebSocket response:', error);
            }
          };
          this._wsMessageHandlerAdded = true;
        }
        
        // Send the request
        await this.websocket.send(JSON.stringify({
          command: 'execute_code',
          params: { code },
          requestId
        }));
        
        return await responsePromise;
      }

      // Use HTTP backend
      console.log("Using HTTP backend for code execution");
      const response = await fetch(`${API_BASE_URL}/execute-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      let data;
      // Try to parse as JSON, but handle non-JSON responses
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        if (!response.ok) {
          throw new Error(`Failed to execute Blender code: ${text}`);
        }
        return { result: text };
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to execute Blender code');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      if (this.onError) this.onError(error);
      throw error;
    }
  }

  connectToBlender(onSceneUpdate, onConnectionChange) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      if (onConnectionChange) onConnectionChange(true);
      return Promise.resolve();
    }

    if (this.websocket && this.websocket.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connecting');
      return new Promise((resolve) => {
        const checkState = () => {
          if (this.websocket.readyState === WebSocket.OPEN) {
            if (onConnectionChange) onConnectionChange(true);
            resolve();
          } else if (this.websocket.readyState === WebSocket.CLOSED || this.websocket.readyState === WebSocket.CLOSING) {
            this.websocket = null;
            this.connectToBlender(onSceneUpdate, onConnectionChange).then(resolve);
          } else {
            setTimeout(checkState, 100);
          }
        };
        checkState();
      });
    }

    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(BLENDER_WS_URL);
        
        this.websocket.onopen = () => {
          console.log('Connected to Blender WebSocket');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          if (onConnectionChange) onConnectionChange(true);
          if (this.onConnectionChange) this.onConnectionChange(true);
          resolve();
        };
        
        this.websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'scene_update') {
              if (onSceneUpdate) onSceneUpdate(data);
              if (this.onSceneUpdate) this.onSceneUpdate(data);
            }
            
            // Handle other message types
            if (data.type === 'log') {
              console.log('Blender log:', data.content);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            if (this.onError) this.onError(new Error('Error parsing WebSocket message'));
          }
        };
        
        this.websocket.onclose = (event) => {
          console.log('Disconnected from Blender WebSocket:', event.code, event.reason);
          this.isConnected = false;
          if (onConnectionChange) onConnectionChange(false);
          if (this.onConnectionChange) this.onConnectionChange(false);
          
          // Attempt to reconnect only if closed unexpectedly
          if (event.code !== 1000 && event.code !== 1001) {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              this.reconnectAttempts++;
              console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
              setTimeout(() => this.connectToBlender(onSceneUpdate, onConnectionChange), 3000);
            }
          }
        };
        
        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (this.onError) this.onError(new Error('WebSocket connection error'));
          reject(new Error('WebSocket connection error'));
        };
        
        // Set a connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.websocket && this.websocket.readyState !== WebSocket.OPEN) {
            this.websocket.close();
            this.isConnected = false;
            reject(new Error('Connection timeout'));
          }
        }, 10000);
        
        // Clear the timeout when connected
        this.websocket.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('Connected to Blender WebSocket');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          if (onConnectionChange) onConnectionChange(true);
          if (this.onConnectionChange) this.onConnectionChange(true);
          resolve();
        };
        
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        if (this.onError) this.onError(error);
        reject(error);
      }
    });
  }

  disconnectFromBlender() {
    if (this.websocket) {
      // Use a clean close
      this.websocket.close(1000, 'Disconnected by user');
      this.websocket = null;
      this.isConnected = false;
    }
  }

  isBlenderConnected() {
    return this.isConnected && this.websocket && this.websocket.readyState === WebSocket.OPEN;
  }

  // Special method to handle fallback mode
  async testBackendConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        console.log('Backend connection successful');
        FALLBACK_MODE = false;
        return true;
      }
      console.warn('Backend connection failed, using fallback mode');
      FALLBACK_MODE = true;
      return false;
    } catch (error) {
      console.warn('Backend connection error, using fallback mode:', error.message);
      FALLBACK_MODE = true;
      return false;
    }
  }
}

export const apiClient = new ApiClient(); 