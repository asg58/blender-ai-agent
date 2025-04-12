import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../utils/apiClient';
import { useToast } from './ToastNotification';

const CommandInput = () => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const historyEndRef = useRef(null);
  const { showSuccess, showError } = useToast();
  
  // Auto-scroll to the bottom when history updates
  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  // Listen for connection changes
  useEffect(() => {
    // Check initial connection status
    setIsConnected(apiClient.isBlenderConnected());
    
    // Update connection status when it changes
    const handleConnectionChange = (event) => {
      const connected = event.detail;
      setIsConnected(connected);
    };
    
    // Listen for connection change events
    window.addEventListener('blender_connection_change', handleConnectionChange);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('blender_connection_change', handleConnectionChange);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!command.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const trimmedCommand = command.trim();
      
      // Add to history
      const timestamp = new Date().toLocaleTimeString();
      setHistory(prev => [...prev, { 
        type: 'command', 
        text: trimmedCommand,
        timestamp
      }]);
      
      // Check if Blender is connected
      if (!isConnected) {
        setHistory(prev => [...prev, { 
          type: 'error', 
          text: 'Blender is not connected. Please connect first.',
          timestamp: new Date().toLocaleTimeString()
        }]);
        showError('Blender is not connected. Please connect first.');
        setIsLoading(false);
        return;
      }
      
      // Send command to backend
      const response = await apiClient.sendCommand(trimmedCommand);
      
      // Add response to history
      setHistory(prev => [...prev, { 
        type: 'response', 
        text: response.message || 'Command processed successfully',
        code: response.code,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      // Clear input
      setCommand('');
      
      // Show success notification if there's code to execute
      if (response.code) {
        showSuccess('Command processed successfully. Execute the code to apply changes.');
      }
    } catch (error) {
      console.error('Error sending command:', error);
      setHistory(prev => [...prev, { 
        type: 'error', 
        text: error.message || 'An error occurred',
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      showError(error.message || 'Failed to process command');
    } finally {
      setIsLoading(false);
    }
  };

  const executeCode = async (code) => {
    if (!code || isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Check if Blender is connected
      if (!isConnected) {
        setHistory(prev => [...prev, { 
          type: 'error', 
          text: 'Blender is not connected. Please connect first.',
          timestamp: new Date().toLocaleTimeString()
        }]);
        showError('Blender is not connected. Please connect first.');
        setIsLoading(false);
        return;
      }
      
      const response = await apiClient.executeBlenderCommand(code);
      
      setHistory(prev => [...prev, { 
        type: 'execution', 
        text: response.result || 'Code executed successfully',
        success: true,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      showSuccess('Code executed successfully in Blender');
    } catch (error) {
      console.error('Error executing code:', error);
      setHistory(prev => [...prev, { 
        type: 'error', 
        text: error.message || 'An error occurred during execution',
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      showError(error.message || 'Failed to execute code in Blender');
    } finally {
      setIsLoading(false);
    }
  };

  const renderHistoryItem = (item, index) => {
    const isCommand = item.type === 'command';
    const isResponse = item.type === 'response';
    const isError = item.type === 'error';
    const isExecution = item.type === 'execution';
    
    let bgColor = 'bg-white dark:bg-gray-700';
    let textColor = 'text-gray-800 dark:text-gray-200';
    let borderColor = '';
    
    if (isCommand) {
      bgColor = 'bg-blue-50 dark:bg-blue-900/20';
      borderColor = 'border-l-4 border-blue-500';
    } else if (isError) {
      bgColor = 'bg-red-50 dark:bg-red-900/20';
      borderColor = 'border-l-4 border-red-500';
      textColor = 'text-red-700 dark:text-red-300';
    } else if (isExecution) {
      bgColor = 'bg-green-50 dark:bg-green-900/20';
      borderColor = 'border-l-4 border-green-500';
    }
    
    return (
      <div 
        key={index} 
        className={`mb-3 p-3 rounded-md ${bgColor} ${borderColor} ${textColor}`}
      >
        {isCommand && (
          <div className="flex items-center mb-1">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mr-2">COMMAND</span>
            <span className="text-xs text-gray-500">{item.timestamp}</span>
          </div>
        )}
        
        {isResponse && (
          <div className="flex items-center mb-1">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 mr-2">RESPONSE</span>
            <span className="text-xs text-gray-500">{item.timestamp}</span>
          </div>
        )}
        
        {isError && (
          <div className="flex items-center mb-1">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 mr-2">ERROR</span>
            <span className="text-xs text-gray-500">{item.timestamp}</span>
          </div>
        )}
        
        {isExecution && (
          <div className="flex items-center mb-1">
            <span className="text-xs font-bold text-green-600 dark:text-green-400 mr-2">EXECUTION</span>
            <span className="text-xs text-gray-500">{item.timestamp}</span>
          </div>
        )}
        
        <div className="text-sm">{item.text}</div>
        
        {isResponse && item.code && (
          <div className="mt-3 relative">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Python Code</span>
                <button 
                  onClick={() => executeCode(item.code)}
                  disabled={isLoading || !isConnected}
                  className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded
                            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Executing...' : 'Execute Code'}
                </button>
              </div>
              <pre className="text-xs overflow-x-auto font-mono text-gray-800 dark:text-gray-200">{item.code}</pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getPlaceholderText = () => {
    if (!isConnected) {
      return "Connect to Blender first...";
    }
    return "Ask Blender AI to do something...";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 rounded-md mb-3 p-3 min-h-[300px] max-h-[500px]">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm italic">
            {isConnected 
              ? "Your conversation with Blender AI will appear here"
              : "Connect to Blender to start using the AI agent"
            }
          </div>
        ) : (
          <>
            {history.map(renderHistoryItem)}
            <div ref={historyEndRef} />
          </>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={getPlaceholderText()}
          disabled={isLoading || !isConnected}
          className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                    rounded-md shadow-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <button 
          type="submit" 
          disabled={isLoading || !command.trim() || !isConnected}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow
                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing
            </>
          ) : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default CommandInput; 