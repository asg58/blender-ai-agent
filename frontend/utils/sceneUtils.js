import * as THREE from 'three';

/**
 * Converts Blender vertices data to Three.js format
 * @param {Array} vertices - Array of vertex coordinates from Blender [x1, y1, z1, x2, y2, z2, ...]
 * @returns {Float32Array} - Vertices in Three.js format
 */
export function convertVertices(vertices) {
  // Blender uses Z-up, Three.js uses Y-up, so we need to swap Y and Z
  const threeVertices = new Float32Array(vertices.length);
  
  for (let i = 0; i < vertices.length; i += 3) {
    threeVertices[i] = vertices[i];       // X stays the same
    threeVertices[i + 1] = vertices[i + 2]; // Y in Three.js = Z in Blender
    threeVertices[i + 2] = -vertices[i + 1]; // Z in Three.js = -Y in Blender
  }
  
  return threeVertices;
}

/**
 * Creates a Three.js geometry from Blender mesh data
 * @param {Object} meshData - Mesh data from Blender
 * @returns {THREE.BufferGeometry} - Three.js geometry
 */
export function createGeometryFromBlenderMesh(meshData) {
  const geometry = new THREE.BufferGeometry();
  
  // Add vertices
  if (meshData.vertices && meshData.vertices.length > 0) {
    const vertices = convertVertices(meshData.vertices);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  }
  
  // Add faces/indices
  if (meshData.faces && meshData.faces.length > 0) {
    geometry.setIndex(meshData.faces);
  }
  
  // Add normals if available
  if (meshData.normals && meshData.normals.length > 0) {
    const normals = convertVertices(meshData.normals);
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  } else {
    geometry.computeVertexNormals();
  }
  
  // Add UVs if available
  if (meshData.uvs && meshData.uvs.length > 0) {
    const uvs = new Float32Array(meshData.uvs);
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  }
  
  return geometry;
}

/**
 * Creates a Three.js material from Blender material data
 * @param {Object} materialData - Material data from Blender
 * @returns {THREE.Material} - Three.js material
 */
export function createMaterialFromBlenderMaterial(materialData) {
  if (!materialData) {
    // Default material if none provided
    return new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.5,
      metalness: 0.5
    });
  }
  
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(
      materialData.color?.[0] ?? 0.8,
      materialData.color?.[1] ?? 0.8,
      materialData.color?.[2] ?? 0.8
    ),
    roughness: materialData.roughness ?? 0.5,
    metalness: materialData.metalness ?? 0.0,
    transparent: materialData.opacity < 1.0,
    opacity: materialData.opacity ?? 1.0,
    emissive: materialData.emissive ? new THREE.Color(
      materialData.emissive[0],
      materialData.emissive[1],
      materialData.emissive[2]
    ) : new THREE.Color(0, 0, 0),
    emissiveIntensity: materialData.emissiveIntensity ?? 1.0
  });
  
  return material;
}

/**
 * Creates a Three.js mesh from Blender object data
 * @param {Object} objectData - Object data from Blender
 * @returns {THREE.Mesh} - Three.js mesh
 */
export function createObjectFromBlenderData(objectData) {
  if (!objectData || !objectData.mesh) {
    console.error('Invalid object data', objectData);
    return null;
  }
  
  const geometry = createGeometryFromBlenderMesh(objectData.mesh);
  const material = createMaterialFromBlenderMaterial(objectData.material);
  const mesh = new THREE.Mesh(geometry, material);
  
  // Set transform
  if (objectData.position) {
    mesh.position.set(
      objectData.position[0],
      objectData.position[2],  // Y in Three.js = Z in Blender
      -objectData.position[1]  // Z in Three.js = -Y in Blender
    );
  }
  
  if (objectData.rotation) {
    // Convert Euler rotation from Blender to Three.js
    // Blender uses ZYX order, Three.js uses XYZ order
    const rotationEuler = new THREE.Euler(
      objectData.rotation[0],
      objectData.rotation[2],  // Y in Three.js = Z in Blender
      -objectData.rotation[1], // Z in Three.js = -Y in Blender
      'ZYX'
    );
    mesh.setRotationFromEuler(rotationEuler);
  }
  
  if (objectData.scale) {
    mesh.scale.set(
      objectData.scale[0],
      objectData.scale[2],  // Y in Three.js = Z in Blender
      objectData.scale[1]   // Z in Three.js = Y in Blender
    );
  }
  
  // Set name if available
  if (objectData.name) {
    mesh.name = objectData.name;
  }
  
  return mesh;
}

/**
 * Creates a Three.js light from Blender light data
 * @param {Object} lightData - Light data from Blender
 * @returns {THREE.Light} - Three.js light
 */
export function createLightFromBlenderData(lightData) {
  let light;
  
  switch (lightData.type) {
    case 'POINT':
      light = new THREE.PointLight(
        new THREE.Color(lightData.color[0], lightData.color[1], lightData.color[2]),
        lightData.intensity
      );
      light.decay = 2; // Physical decay
      break;
      
    case 'SUN':
    case 'DIRECTIONAL':
      light = new THREE.DirectionalLight(
        new THREE.Color(lightData.color[0], lightData.color[1], lightData.color[2]),
        lightData.intensity
      );
      light.castShadow = lightData.castShadow || false;
      break;
      
    case 'SPOT':
      light = new THREE.SpotLight(
        new THREE.Color(lightData.color[0], lightData.color[1], lightData.color[2]),
        lightData.intensity,
        lightData.distance || 0,
        lightData.spotSize || Math.PI/4,
        lightData.spotBlend || 0.15,
        2 // Physical decay
      );
      light.castShadow = lightData.castShadow || false;
      break;
      
    case 'AREA':
      light = new THREE.RectAreaLight(
        new THREE.Color(lightData.color[0], lightData.color[1], lightData.color[2]),
        lightData.intensity,
        lightData.size || 1,
        lightData.sizeY || 1
      );
      break;
      
    default:
      light = new THREE.AmbientLight(
        new THREE.Color(lightData.color[0], lightData.color[1], lightData.color[2]),
        lightData.intensity || 0.5
      );
  }
  
  // Set position (with coordinate system conversion)
  if (lightData.position) {
    light.position.set(
      lightData.position[0],
      lightData.position[2],  // Y in Three.js = Z in Blender
      -lightData.position[1]  // Z in Three.js = -Y in Blender
    );
  }
  
  // Set name if available
  if (lightData.name) {
    light.name = lightData.name;
  }
  
  return light;
}

/**
 * Updates a Three.js scene from Blender scene data
 * @param {THREE.Scene} scene - Three.js scene to update
 * @param {Object} sceneData - Scene data from Blender
 */
export function updateSceneFromBlenderData(scene, sceneData) {
  if (!scene || !sceneData) {
    console.error('Invalid scene or scene data');
    return;
  }
  
  // Clear existing objects (optional - depends on your application's needs)
  // You might want to keep track of existing objects and update them instead
  while (scene.children.length > 0) {
    const object = scene.children[0];
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(material => material.dispose());
      } else {
        object.material.dispose();
      }
    }
    scene.remove(object);
  }
  
  // Add objects from scene data
  if (sceneData.objects && Array.isArray(sceneData.objects)) {
    sceneData.objects.forEach(objectData => {
      const object = createObjectFromBlenderData(objectData);
      if (object) {
        scene.add(object);
      }
    });
  }
  
  // Add lights from scene data
  if (sceneData.lights && Array.isArray(sceneData.lights)) {
    sceneData.lights.forEach(lightData => {
      const light = createLightFromBlenderData(lightData);
      if (light) {
        scene.add(light);
      }
    });
  }
  
  // Set background if available
  if (sceneData.background) {
    scene.background = new THREE.Color(
      sceneData.background[0],
      sceneData.background[1],
      sceneData.background[2]
    );
  }
}

/**
 * Creates a basic Three.js scene with default objects
 * @param {THREE.Scene} scene - Three.js scene to add objects to
 */
export function createDefaultScene(scene) {
  // Add a simple cube
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 1);
  scene.add(ambientLight);
  
  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);
  
  // Set background
  scene.background = new THREE.Color(0x333333);
} 