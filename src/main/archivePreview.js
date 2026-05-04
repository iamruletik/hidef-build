  import * as THREE from 'three'

  export default function archivePreviewInit() {
    const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  
  const container = document.getElementById('canvas-container');
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); 
  container.appendChild(renderer.domElement);

  // Carousel Group
  const carousel = new THREE.Group();
  scene.add(carousel);

  // Configuration
  const numImages = 9; 
  const radius = 6.5;  
  
  // Dimensions for the tall rounded cards
  const cardWidth = 1.8;
  const cardHeight = 2.4;
  const cornerRadius = 0.15; 

  // Helper function to draw a rounded rectangle shape
  function createRoundedRectShape(width, height, radius) {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x, y + radius);
    shape.lineTo(x, y + height - radius);
    shape.quadraticCurveTo(x, y + height, x + radius, y + height);
    shape.lineTo(x + width - radius, y + height);
    shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    shape.lineTo(x + width, y + radius);
    shape.quadraticCurveTo(x + width, y, x + width - radius, y);
    shape.lineTo(x + radius, y);
    shape.quadraticCurveTo(x, y, x, y + radius);

    return shape;
  }

  // Create the geometry using the shape
  const roundedShape = createRoundedRectShape(cardWidth, cardHeight, cornerRadius);
  const geometry = new THREE.ShapeGeometry(roundedShape);

  // --- FIX: Recalculate UVs to fill the shape without repeating ---
  const posAttribute = geometry.attributes.position;
  const uvAttribute = geometry.attributes.uv;

  for (let i = 0; i < posAttribute.count; i++) {
    const x = posAttribute.getX(i);
    const y = posAttribute.getY(i);

    // Normalize coordinates to a 0-1 scale based on card dimensions
    const u = (x + cardWidth / 2) / cardWidth;
    const v = (y + cardHeight / 2) / cardHeight;

    uvAttribute.setXY(i, u, v);
  }
  uvAttribute.needsUpdate = true;
  // ---------------------------------------------------------------

  // Texture Loader
  const textureLoader = new THREE.TextureLoader();
  const imageUrls = [
    'https://storage.googleapis.com/radiance/carousel/carousel1.jpg', 
    'https://storage.googleapis.com/radiance/carousel/carousel2.jpg',
    'https://storage.googleapis.com/radiance/carousel/carousel3.jpg',
    'https://storage.googleapis.com/radiance/carousel/carousel4.jpg',
    'https://storage.googleapis.com/radiance/carousel/carousel5.jpg',
    'https://storage.googleapis.com/radiance/carousel/carousel6.jpg',
    'https://storage.googleapis.com/radiance/carousel/carousel7.jpg',
    'https://storage.googleapis.com/radiance/carousel/carousel8.jpg',
    'https://storage.googleapis.com/radiance/carousel/carousel9.jpg',
  ];

  // Create Image Planes
  for (let i = 0; i < numImages; i++) {
    const texture = textureLoader.load(imageUrls[i % imageUrls.length]);
    // Note: Removed RepeatWrapping so the image just fills the area once
    
    const material = new THREE.MeshBasicMaterial({ 
      map: texture,
      side: THREE.DoubleSide,
      transparent: true
    });
    
    const plane = new THREE.Mesh(geometry, material);
    
    // Position in a perfect circle
    const angle = (i / numImages) * Math.PI * 2;
    plane.position.x = Math.cos(angle) * radius;
    plane.position.z = Math.sin(angle) * radius;
    
    // Orient strictly to face the center
    plane.rotation.y = -angle + Math.PI / 2;

    carousel.add(plane);
  }

  // Position Camera and Tilt Carousel
  camera.position.z = 16;
  camera.position.y = -1;
  carousel.rotation.x = 0.7; 
  carousel.rotation.z = 0.3; 

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Slowly spin the entire carousel
    
    carousel.rotation.y -= 0.0003; 
    
    renderer.render(scene, camera);
  }
  animate();

  // Handle Window Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  }

  