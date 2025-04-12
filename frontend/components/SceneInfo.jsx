import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import { useToast } from './ToastNotification';

const SceneInfo = () => {
  const [sceneInfo, setSceneInfo] = useState({
    objectCount: 0,
    activeObject: 'None',
    renderEngine: 'Unknown',
    sceneFrames: { start: 0, end: 250, current: 1 },
    lastUpdate: null
  });
  const [isConnected, setIsConnected] = useState(false);
  const { showError } = useToast();

  useEffect(() => {
    // Check initial connection status
    const initialConnectionStatus = apiClient.isBlenderConnected();
    setIsConnected(initialConnectionStatus);
    
    // Set up scene update listener
    const handleSceneUpdate = (data) => {
      if (data) {
        setSceneInfo(prevInfo => ({
          ...prevInfo,
          ...data,
          lastUpdate: new Date().toLocaleTimeString()
        }));
      }
    };

    // Connection change handler
    const handleConnectionChange = (connected) => {
      setIsConnected(connected);
      if (connected && !sceneInfo.lastUpdate) {
        // If we just connected and don't have scene info yet, fetch it
        getSceneInfo();
      }
    };
    
    // Set up initial scene query
    const getSceneInfo = async () => {
      if (!apiClient.isBlenderConnected()) {
        return;
      }
      
      try {
        const code = `
import bpy
import json

def get_scene_info():
    scene = bpy.context.scene
    active_obj = bpy.context.active_object
    
    info = {
        "objectCount": len(bpy.data.objects),
        "activeObject": active_obj.name if active_obj else "None",
        "renderEngine": scene.render.engine,
        "sceneFrames": {
            "start": scene.frame_start,
            "end": scene.frame_end,
            "current": scene.frame_current
        }
    }
    
    return json.dumps(info)

get_scene_info()
        `;
        
        const response = await apiClient.executeBlenderCommand(code);
        if (response && response.result) {
          try {
            const data = JSON.parse(response.result);
            handleSceneUpdate(data);
          } catch (e) {
            console.error('Error parsing scene info:', e);
            showError('Failed to parse scene information');
          }
        }
      } catch (err) {
        console.error('Failed to get scene info:', err);
        showError('Failed to get scene information');
      }
    };
    
    // Register for connection status changes
    const connectionChangeHandler = (connected) => {
      handleConnectionChange(connected);
    };
    
    // Register for scene updates
    const sceneUpdateHandler = (data) => {
      if (data && data.type === 'scene_update') {
        handleSceneUpdate(data.content);
      }
    };
    
    // If already connected, get initial scene info
    if (initialConnectionStatus) {
      getSceneInfo();
    }
    
    // Set up event listeners for Blender connection status
    window.addEventListener('blender_connection_change', (e) => connectionChangeHandler(e.detail));
    window.addEventListener('blender_scene_update', (e) => sceneUpdateHandler(e.detail));
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('blender_connection_change', connectionChangeHandler);
      window.removeEventListener('blender_scene_update', sceneUpdateHandler);
    };
  }, [showError]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Scene Information</h3>
      
      {!isConnected ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400 italic">
          Connect to Blender to view scene information
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600 dark:text-gray-400">Object Count:</div>
          <div className="font-medium text-gray-800 dark:text-gray-200">{sceneInfo.objectCount}</div>
          
          <div className="text-gray-600 dark:text-gray-400">Active Object:</div>
          <div className="font-medium text-gray-800 dark:text-gray-200">{sceneInfo.activeObject}</div>
          
          <div className="text-gray-600 dark:text-gray-400">Render Engine:</div>
          <div className="font-medium text-gray-800 dark:text-gray-200">{sceneInfo.renderEngine}</div>
          
          <div className="text-gray-600 dark:text-gray-400">Frame Range:</div>
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {sceneInfo.sceneFrames.start} - {sceneInfo.sceneFrames.end}
          </div>
          
          <div className="text-gray-600 dark:text-gray-400">Current Frame:</div>
          <div className="font-medium text-gray-800 dark:text-gray-200">{sceneInfo.sceneFrames.current}</div>
        </div>
      )}
      
      {isConnected && sceneInfo.lastUpdate && (
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
          Last updated: {sceneInfo.lastUpdate}
        </div>
      )}
    </div>
  );
};

export default SceneInfo; 