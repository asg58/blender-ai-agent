import React from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class BlenderView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      error: null
    };
    this.containerRef = React.createRef();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animationId = null;
  }

  componentDidMount() {
    this.initThreeJS();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.disposeThreeJS();
  }

  componentDidUpdate(prevProps) {
    // If we receive new scene data from Blender, update the view
    if (this.props.sceneData !== prevProps.sceneData && this.props.sceneData) {
      this.updateScene(this.props.sceneData);
    }
  }

  initThreeJS() {
    try {
      const container = this.containerRef.current;
      if (!container) return;

      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x1e1e1e);

      // Camera
      const aspect = container.clientWidth / container.clientHeight;
      this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
      this.camera.position.z = 5;

      // Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(this.renderer.domElement);

      // Controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.25;

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      this.scene.add(directionalLight);

      // Add axes helper
      const axesHelper = new THREE.AxesHelper(5);
      this.scene.add(axesHelper);

      // Add grid
      const gridHelper = new THREE.GridHelper(10, 10);
      this.scene.add(gridHelper);

      // Add a default cube
      this.addDefaultObjects();

      // Start animation loop
      this.animate();

      this.setState({ loading: false });
    } catch (error) {
      console.error('Error initializing Three.js:', error);
      this.setState({ loading: false, error: 'Failed to initialize 3D view' });
    }
  }

  addDefaultObjects() {
    // Add a cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
  }

  updateScene(sceneData) {
    try {
      // Clear existing objects except lights, grid and axes
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          object.material.dispose();
          this.scene.remove(object);
        }
      });

      // Parse and add new objects based on sceneData
      if (sceneData.objects) {
        sceneData.objects.forEach(obj => {
          let geometry;
          let material;

          switch (obj.type) {
            case 'cube':
              geometry = new THREE.BoxGeometry(
                obj.scale.x || 1, 
                obj.scale.y || 1, 
                obj.scale.z || 1
              );
              break;
            case 'sphere':
              geometry = new THREE.SphereGeometry(
                obj.radius || 1, 
                32, 32
              );
              break;
            case 'cylinder':
              geometry = new THREE.CylinderGeometry(
                obj.radiusTop || 1, 
                obj.radiusBottom || 1, 
                obj.height || 2, 
                32
              );
              break;
            default:
              geometry = new THREE.BoxGeometry(1, 1, 1);
          }

          material = new THREE.MeshStandardMaterial({
            color: obj.color || 0x00aaff,
            metalness: obj.metalness || 0.2,
            roughness: obj.roughness || 0.8
          });

          const mesh = new THREE.Mesh(geometry, material);
          
          if (obj.position) {
            mesh.position.set(
              obj.position.x || 0,
              obj.position.y || 0,
              obj.position.z || 0
            );
          }
          
          if (obj.rotation) {
            mesh.rotation.set(
              obj.rotation.x || 0,
              obj.rotation.y || 0,
              obj.rotation.z || 0
            );
          }

          mesh.name = obj.name || `object-${Math.random().toString(36).substr(2, 9)}`;
          
          this.scene.add(mesh);
        });
      }

      // Update camera if specified
      if (sceneData.camera) {
        if (sceneData.camera.position) {
          this.camera.position.set(
            sceneData.camera.position.x || this.camera.position.x,
            sceneData.camera.position.y || this.camera.position.y,
            sceneData.camera.position.z || this.camera.position.z
          );
        }
        
        if (sceneData.camera.lookAt) {
          this.camera.lookAt(
            sceneData.camera.lookAt.x || 0,
            sceneData.camera.lookAt.y || 0,
            sceneData.camera.lookAt.z || 0
          );
        }
        
        if (sceneData.camera.fov) {
          this.camera.fov = sceneData.camera.fov;
          this.camera.updateProjectionMatrix();
        }
      }

      this.controls.update();
    } catch (error) {
      console.error('Error updating scene:', error);
    }
  }

  animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    
    if (this.controls) {
      this.controls.update();
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  handleResize = () => {
    if (!this.containerRef.current || !this.camera || !this.renderer) return;
    
    const container = this.containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  disposeThreeJS() {
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
    
    if (this.controls) {
      this.controls.dispose();
    }
  }

  render() {
    const { loading, error } = this.state;

    if (loading) {
      return (
        <div className="blender-view-container loading">
          <div className="loading-spinner"></div>
          <p>Initializing 3D View...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="blender-view-container error">
          <p className="error-message">{error}</p>
          <button onClick={this.initThreeJS}>Retry</button>
        </div>
      );
    }

    return (
      <div className="blender-view-container" ref={this.containerRef}></div>
    );
  }
}

// Add CSS styles
const blenderViewStyles = document.createElement('style');
blenderViewStyles.textContent = `
  .blender-view-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background-color: #1e1e1e;
    border-radius: var(--border-radius);
  }

  .blender-view-container.loading,
  .blender-view-container.error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--text-color);
  }

  .loading-spinner {
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    border-top: 4px solid var(--primary-color);
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-message {
    color: var(--error-color);
    margin-bottom: 16px;
  }

  .blender-view-container button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.2s;
  }

  .blender-view-container button:hover {
    background-color: var(--primary-color-hover);
  }
`;
document.head.appendChild(blenderViewStyles);

export default BlenderView; 