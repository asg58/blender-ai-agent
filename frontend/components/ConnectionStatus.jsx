import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import { useToast } from './ToastNotification';

const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    // Check initial connection status
    const initialStatus = apiClient.isBlenderConnected();
    setIsConnected(initialStatus);

    // Set up connection status listener
    const handleConnectionChange = (connected) => {
      setIsConnected(connected);
      if (connected) {
        setError(null);
        setIsConnecting(false);
      }
    };

    // Initially try to connect if not already connected
    if (!initialStatus) {
      connectToBlender();
    }

    // Dispatch connection events to other components
    const dispatchConnectionEvent = (connected) => {
      window.dispatchEvent(new CustomEvent('blender_connection_change', { 
        detail: connected 
      }));
    };

    // Handle scene updates
    const handleSceneUpdate = (data) => {
      window.dispatchEvent(new CustomEvent('blender_scene_update', { 
        detail: data 
      }));
    };

    // Subscribe to apiClient events
    apiClient.onConnectionChange = (connected) => {
      handleConnectionChange(connected);
      dispatchConnectionEvent(connected);
    };

    apiClient.onSceneUpdate = (data) => {
      handleSceneUpdate(data);
    };

    // Clean up event handlers on unmount, but don't automatically disconnect
    return () => {
      apiClient.onConnectionChange = null;
      apiClient.onSceneUpdate = null;
    };
  }, []);

  const connectToBlender = async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      await apiClient.connectToBlender(
        // Scene update handler
        (data) => {
          // This is handled by the onSceneUpdate setter above
          console.log('Scene update received:', data);
        },
        // Connection change handler
        (connected) => {
          setIsConnected(connected);
          setIsConnecting(false);
          
          if (!connected) {
            const errorMsg = 'Connection to Blender lost';
            setError(errorMsg);
            showError(errorMsg);
          } else {
            setError(null);
            showSuccess('Connected to Blender successfully');
          }
        }
      );
    } catch (err) {
      const errorMsg = err.message || 'Failed to connect to Blender';
      setError(errorMsg);
      setIsConnecting(false);
      setIsConnected(false);
      showError(errorMsg);
    }
  };

  const disconnectFromBlender = () => {
    if (!isConnected) return;
    
    try {
      apiClient.disconnectFromBlender();
      setIsConnected(false);
      showSuccess('Disconnected from Blender');
    } catch (err) {
      showError('Error disconnecting from Blender');
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Blender: {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      <div>
        {!isConnected ? (
          <button 
            onClick={connectToBlender}
            disabled={isConnecting}
            className="px-3 py-1 text-xs font-medium rounded bg-blue-500 text-white hover:bg-blue-600 
                      disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </span>
            ) : 'Connect'}
          </button>
        ) : (
          <button 
            onClick={disconnectFromBlender}
            className="px-3 py-1 text-xs font-medium rounded bg-gray-200 text-gray-800 hover:bg-gray-300 
                      dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Disconnect
          </button>
        )}
      </div>
      
      {error && (
        <div className="absolute mt-2 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus; 