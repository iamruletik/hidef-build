import barba from '@barba/core'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'

export class Disco {
    constructor() {
        this.scene = new THREE.Scene()
        this.discoball = null
        this.container = document.querySelector('.disco-container')
        this.mainContainer = document.querySelector("main")
        this.camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 100)
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        this.modelLink = "https://storage.googleapis.com/radiance/disco_ball_with_colored_lights.glb"
        this.HDRILink = "https://storage.googleapis.com/radiance/wooden_studio_17_1k.hdr"
        this.gltfLoader = new GLTFLoader()
        this.hdrLoader = new HDRLoader()
        this.menuButton = document.querySelector('.menu_button')
        this.menuLinks = document.querySelectorAll('.menu-large-link')
        this.scrollTimeline = null
    }

    async load() {
        // Use arrow functions to maintain 'this' context
        try {
            let namespace
            barba.hooks.beforeEnter((data) => {
                console.log('Now in namespace:', data.next.namespace)
                namespace = data.next.namespace
            })
            await this.getGLTF()
            await this.getHDRI()
            this.setupScene()
            if (namespace == "main") { this.animate() }
            else {
                this.discoball.position.y = 2
                this.discoball.position.z = -5
            }

            this.changeThis()
            return this.run()
        } catch (err) {
            return console.error("Loading failed:", err)
        }
    }

    getGLTF() {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                this.modelLink,
                (gltf) => {
                    this.discoball = gltf.scene; // GLTF result has a .scene property

                    this.centerModel()

                    this.scene.add(this.discoball)
                    resolve()
                },
                undefined, // Progress callback
                (error) => reject(error) // Error callback
            )
        })
    }


    getHDRI() {
        return new Promise((resolve, reject) => {
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
        })
    }

    centerModel() {
        // Center the model
        let box = new THREE.Box3().setFromObject(this.discoball)
        let center = box.getCenter(new THREE.Vector3())
        this.discoball.position.sub(center)
        this.discoball.position.y += 0.25
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

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
        this.scene.add(ambientLight)

        const pinkLight = new THREE.PointLight(0xff00aa, 50)
        pinkLight.position.set(2, 2, 2)
        this.scene.add(pinkLight)

        const blueLight = new THREE.PointLight(0x00aaff, 50)
        blueLight.position.set(-2, -2, 2)
        this.scene.add(blueLight)


        window.addEventListener('resize', () => {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight
            this.camera.updateProjectionMatrix()
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
        })
    }

    run() {
        this.renderer.setAnimationLoop(() => {
            if (this.discoball) {
                this.discoball.rotation.y += 0.1 // Speed it up slightly
            }
            this.renderer.render(this.scene, this.camera)
        })
    }

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

}