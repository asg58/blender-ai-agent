import React, { useState, useEffect, useRef } from 'react';
import BlenderViewer from '../components/BlenderViewer';

const BlenderScene = () => {
  const [connected, setConnected] = useState(false);
  const [sceneData, setSceneData] = useState(null);
  const [status, setStatus] = useState('Disconnected');
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket server
    const connectWebSocket = () => {
      try {
        // Use the correct port for the Blender WebSocket server
        const socket = new WebSocket('ws://localhost:9876');
        socketRef.current = socket;

        socket.onopen = () => {
          setConnected(true);
          setStatus('Connected to Blender');
          setError(null);
          
          // Request initial scene data
          socket.send(JSON.stringify({ 
            command: 'get_scene_data',
            params: {}
          }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'scene_data') {
              setSceneData(data.data);
            } else if (data.type === 'error') {
              setError(`Blender error: ${data.message}`);
            } else if (data.type === 'status') {
              setStatus(data.message);
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
            setError(`Failed to parse message: ${err.message}`);
          }
        };

        socket.onclose = () => {
          setConnected(false);
          setStatus('Disconnected from Blender');
          
          // Attempt to reconnect after a delay
          setTimeout(connectWebSocket, 3000);
        };

        socket.onerror = (err) => {
          console.error('WebSocket error:', err);
          setError(`WebSocket error: ${err.message || 'Unknown error'}`);
          setStatus('Connection error');
        };
      } catch (err) {
        console.error('Failed to connect:', err);
        setError(`Connection failed: ${err.message}`);
        setStatus('Connection failed');
        
        // Attempt to reconnect after a delay
        setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const sendCommand = (command, params = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ command, params }));
    } else {
      setError('Cannot send command: WebSocket is not connected');
    }
  };

  const requestSceneUpdate = () => {
    sendCommand('get_scene_data');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Blender Scene Viewer</h1>
      
      <div className="mb-4 flex items-center">
        <div className={`h-3 w-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="mr-4">{status}</span>
        <button 
          onClick={requestSceneUpdate}
          disabled={!connected}
          className={`px-4 py-2 rounded ${connected 
            ? 'bg-blue-500 hover:bg-blue-600 text-white' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          Refresh Scene
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="border rounded-lg overflow-hidden">
        <BlenderViewer sceneData={sceneData} height="70vh" />
      </div>
    </div>
  );
};

export default BlenderScene; 