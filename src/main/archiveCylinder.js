import * as THREE from 'three'

export class archivePreview {

  constructor() {
        this.scene = new THREE.Scene() 
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        this.carousel = new THREE.Group()
        this.textureLoader = new THREE.TextureLoader()
        this.container = document.getElementById('canvas-container')
        this.numImages = 9
        this.radius = 6.5
        this.cardWidth = 1.8
        this.cardHeight = 2.4
        this.cornerRadius = 0.15
        this.imageUrls = [
                                'https://storage.googleapis.com/radiance/carousel/carousel1.jpg',
                                'https://storage.googleapis.com/radiance/carousel/carousel2.jpg',
                                'https://storage.googleapis.com/radiance/carousel/carousel3.jpg',
                                'https://storage.googleapis.com/radiance/carousel/carousel4.jpg',
                                'https://storage.googleapis.com/radiance/carousel/carousel5.jpg',
                                'https://storage.googleapis.com/radiance/carousel/carousel6.jpg',
                                'https://storage.googleapis.com/radiance/carousel/carousel7.jpg',
                                'https://storage.googleapis.com/radiance/carousel/carousel8.jpg',
                                'https://storage.googleapis.com/radiance/carousel/carousel9.jpg',
                            ]
    }

  create() {

    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x000000, 0)

    //console.log(this.renderer.domElement)

    this.scene.add(this.carousel)

    const roundedShape = createRoundedRectShape(this.cardWidth, this.cardHeight, this.cornerRadius)
    const geometry = new THREE.ShapeGeometry(roundedShape)

    // --- FIX: Recalculate UVs to fill the shape without repeating ---
    const posAttribute = geometry.attributes.position
    const uvAttribute = geometry.attributes.uv


    for (let i = 0; i < posAttribute.count; i++) {
        const x = posAttribute.getX(i)
        const y = posAttribute.getY(i)

        // Normalize coordinates to a 0-1 scale based on card dimensions
        const u = (x + this.cardWidth / 2) / this.cardWidth
        const v = (y + this.cardHeight / 2) / this.cardHeight

        uvAttribute.setXY(i, u, v)
    }
    uvAttribute.needsUpdate = true

    // Create Image Planes
    for (let i = 0; i < this.numImages; i++) {
        const texture = this.textureLoader.load(this.imageUrls[i % this.imageUrls.length]);
        // Note: Removed RepeatWrapping so the image just fills the area once
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true
        });

        const plane = new THREE.Mesh(geometry, material)

        // Position in a perfect circle
        const angle = (i / this.numImages) * Math.PI * 2
        plane.position.x = Math.cos(angle) * this.radius
        plane.position.z = Math.sin(angle) * this.radius

        // Orient strictly to face the center
        plane.rotation.y = -angle + Math.PI / 2

        this. carousel.add(plane)
    }


    this.camera.position.z = 16
    this.camera.position.y = -1
    this.carousel.rotation.x = 0.7
    this.carousel.rotation.z = 0.3





    function createRoundedRectShape(width, height, radius) {
        const shape = new THREE.Shape()
        const x = -width / 2
        const y = -height / 2

        shape.moveTo(x, y + radius)
        shape.lineTo(x, y + height - radius)
        shape.quadraticCurveTo(x, y + height, x + radius, y + height)
        shape.lineTo(x + width - radius, y + height)
        shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius)
        shape.lineTo(x + width, y + radius)
        shape.quadraticCurveTo(x + width, y, x + width - radius, y)
        shape.lineTo(x + radius, y)
        shape.quadraticCurveTo(x, y, x, y + radius)

        return shape
    }
    
    console.log(this.renderer.info.memory)
  }

  start() {
    console.log(this.container)
    console.log(this.renderer.info.memory)
    this.container.appendChild(this.renderer.domElement)
    this.renderer.setAnimationLoop(() => {
        this.carousel.rotation.y -= 0.0003
        this.renderer.render(this.scene, this.camera) // Render
    })
  }

   stop() {
    console.log("Destroy")
    console.log(this.renderer.info.memory)
        this.renderer.clear()
        this.renderer.setAnimationLoop(null)
        this.renderer.dispose()

    }

    show() {
        console.log("SHOWED")
        console.log(this.renderer.info.memory)
    }

}