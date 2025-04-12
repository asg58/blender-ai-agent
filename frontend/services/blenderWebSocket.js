class BlenderWebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageCallbacks = [];
    this.connectionCallbacks = [];
    this.disconnectionCallbacks = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.reconnectInterval = 3000; // 3 seconds
  }

  connect(url = 'ws://localhost:9876') {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('Connected to Blender WebSocket server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this._notifyConnectionCallbacks();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._notifyMessageCallbacks(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this._notifyMessageCallbacks({ type: 'error', error: 'Failed to parse message' });
        }
      };

      this.socket.onclose = (event) => {
        this.isConnected = false;
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        this._notifyDisconnectionCallbacks(event);
        this._attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this._notifyMessageCallbacks({ type: 'error', error: 'WebSocket connection error' });
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this._attemptReconnect();
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.close(1000, 'Client disconnected');
      this.socket = null;
      this.isConnected = false;
    }
  }

  sendCommand(command, params = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    try {
      const message = JSON.stringify({
        type: 'command',
        command,
        params
      });
      
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('Error sending command:', error);
      return false;
    }
  }

  sendPythonCode(code) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    try {
      const message = JSON.stringify({
        type: 'python_code',
        code
      });
      
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('Error sending Python code:', error);
      return false;
    }
  }

  onMessage(callback) {
    if (typeof callback === 'function') {
      this.messageCallbacks.push(callback);
    }
    return this; // For chaining
  }

  onConnect(callback) {
    if (typeof callback === 'function') {
      this.connectionCallbacks.push(callback);
      // If already connected, call the callback immediately
      if (this.isConnected) {
        callback();
      }
    }
    return this; // For chaining
  }

  onDisconnect(callback) {
    if (typeof callback === 'function') {
      this.disconnectionCallbacks.push(callback);
    }
    return this; // For chaining
  }

  removeMessageCallback(callback) {
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    return this;
  }

  removeConnectionCallback(callback) {
    this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
    return this;
  }

  removeDisconnectionCallback(callback) {
    this.disconnectionCallbacks = this.disconnectionCallbacks.filter(cb => cb !== callback);
    return this;
  }

  _notifyMessageCallbacks(data) {
    this.messageCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in message callback:', error);
      }
    });
  }

  _notifyConnectionCallbacks() {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  _notifyDisconnectionCallbacks(event) {
    this.disconnectionCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in disconnection callback:', error);
      }
    });
  }

  _attemptReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.log('Maximum reconnection attempts reached');
    }
  }
}

// Create a singleton instance
const blenderWebSocket = new BlenderWebSocketService();

export default blenderWebSocket; 