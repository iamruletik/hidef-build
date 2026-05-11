import barba from '@barba/core'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'

export class Disco {
    constructor() {
        this.scene = new THREE.Scene()
        this.container = document.querySelector('.disco-container')
        this.mainContainer = document.querySelector("main")
        this.camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 100)
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        this.model = null
        this.hdri = null
        this.hdrLoader = new HDRLoader()
        this.menuButton = document.querySelector('.menu_button')
        this.menuLinks = document.querySelectorAll('.menu-large-link')
        this.scrollTimeline = null
    }


    async loadModel(contents) {

        const loader = new GLTFLoader()

        try {
            const gltf = await loader.parseAsync(contents)
            this.model = gltf.scene

            const standardMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color( 0xffffff ),
                roughness: 0.1,
                metalness: 1,
                flatShading: true
            })

            const plasticMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color( 0x212121),
                roughness: 0.3,
            })


            this.model.children[0].material = plasticMaterial //HOLDER
            this.model.children[1].material = standardMaterial //INNER
            this.model.children[2].material = standardMaterial //OUTER


            this.scene.add(this.model)
            this.setupScene()
            this.renderer.render(this.scene, this.camera)
            return this.model

        } catch (error) {
            console.error('Error loading GLTF:', error)
        }

    }


    async loadHDRI(url) {
        const loader = new HDRLoader()
        try {
            this.hdri = await loader.loadAsync(url)
            this.hdri.mapping = THREE.EquirectangularReflectionMapping
            this.scene.environment = this.hdri
            return this.hdri
        } catch (error) {
            console.error('Error loading HDRI:', error)
        }
    }

    setupScene() {
        this.camera.position.set(0, 0, 4.5)
        this.camera.lookAt(0, 0, 0)

        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.toneMappingExposure = 1.2
        this.renderer.setClearColor(0x000000, 0)
        this.container.appendChild(this.renderer.domElement)


        window.addEventListener('resize', () => {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight
            this.camera.updateProjectionMatrix()
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
        })
    }

    run(model) {
        this.renderer.setAnimationLoop(() => {
            if (model) {
                model.rotation.y += 0.1 // Speed it up slightly
            }
            this.renderer.render(this.scene, this.camera)
        })
    }





    /*

    animate() {
        //Animate on scroll
        gsap.to(this.discoball.position, {
            z: 0,
            y: 0.05
        })
        this.scrollTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: this.mainContainer,
                start: "top top",
                end: "+=800",
                scrub: 0.5,
                //markers: true,
            }
        })
        this.scrollTimeline.to(this.discoball.position, {
            z: -5,
            y: 2
        })
    }

    killAnimate() {
        this.scrollTimeline.scrollTrigger.kill()
        this.scrollTimeline.kill()
    }


    changeThis() {
        let menuOpen = false
        let cZ, cY

        //Click on Button
        this.menuButton.addEventListener('click', (e) => {

            if (!menuOpen) {

                cZ = this.discoball.position.z
                cY = this.discoball.position.y

                console.log(cZ, cY)

                gsap.to(this.discoball.position, {
                    z: cZ - 1,
                    y: cY + 0.4,
                    ease: "power3.inOut",
                    duration: 0.7
                })
                menuOpen = true

            } else if (menuOpen) {

                gsap.to(this.discoball.position, {
                    y: cY,
                    ease: "power3.inOut",
                    duration: 0.7
                })
                menuOpen = false

            }

        }, true)


        this.menuLinks.forEach((link) => {


            link.addEventListener('click', (e) => {

                gsap.to(this.discoball.position, {
                    z: -5,
                    y: 2,
                    ease: "power3.inOut",
                    duration: 0.7
                })
                menuOpen = false
            })

        })



    }
        */

}


/*        return new Promise((resolve, reject) => {
            this.hdrLoader.load(
                this.HDRILink,
                (texture) => {
                    texture.mapping = THREE.EquirectangularReflectionMapping
                    this.scene.environment = texture
                    resolve()
                },
                undefined, // Progress callback
                (error) => reject(error) // Error callback
            )
        })*/