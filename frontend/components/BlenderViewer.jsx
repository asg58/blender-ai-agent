import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const BlenderViewer = ({ sceneData }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  // Initialize the Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x333333);

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controlsRef.current = controls;

    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Add a grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Update scene based on sceneData
  useEffect(() => {
    if (!sceneRef.current || !sceneData) return;

    // Clear existing objects (except lights and helpers)
    const objectsToRemove = [];
    sceneRef.current.traverse((object) => {
      if (
        object instanceof THREE.Mesh &&
        !(object.parent instanceof THREE.GridHelper)
      ) {
        objectsToRemove.push(object);
      }
    });
    
    objectsToRemove.forEach((object) => {
      sceneRef.current.remove(object);
    });

    // Example: process scene data
    // This is a placeholder - actual scene data processing would
    // depend on the format of data from Blender
    if (sceneData.objects && Array.isArray(sceneData.objects)) {
      sceneData.objects.forEach(obj => {
        if (obj.type === 'cube') {
          const geometry = new THREE.BoxGeometry(
            obj.dimensions?.x || 1,
            obj.dimensions?.y || 1, 
            obj.dimensions?.z || 1
          );
          const material = new THREE.MeshPhongMaterial({ 
            color: obj.color || 0x00ff00,
            wireframe: false 
          });
          const cube = new THREE.Mesh(geometry, material);
          
          if (obj.position) {
            cube.position.set(
              obj.position.x || 0,
              obj.position.y || 0,
              obj.position.z || 0
            );
          }
          
          if (obj.rotation) {
            cube.rotation.set(
              obj.rotation.x || 0,
              obj.rotation.y || 0,
              obj.rotation.z || 0
            );
          }
          
          sceneRef.current.add(cube);
        }
        // Add more object types here as needed
      });
    }

  }, [sceneData]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '500px', 
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}
    />
  );
};

export default BlenderViewer; 