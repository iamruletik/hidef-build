import barba from '@barba/core'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'

export class Disco {
    constructor() {
        this.scene = new THREE.Scene()
        this.container = document.querySelector('.disco-container')
        this.mainContainer = document.querySelector('main')
        this.camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 100)
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        this.model = null
        this.hdri = null
        this.plane = new THREE.Group()
        this.shaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                iTime: { value: 0.0 },
                iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            }
        })
    }


    async loadModel(contents) {

        const loader = new GLTFLoader()

        try {
            const gltf = await loader.parseAsync(contents)
            this.model = gltf.scene

            const standardMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0xffffff),
                roughness: 0.1,
                metalness: 1,
                flatShading: true
            })

            const plasticMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0x212121),
                roughness: 0.3,
            })


            this.model.children[0].material = plasticMaterial //HOLDER
            this.model.children[1].material = standardMaterial //INNER
            this.model.children[2].material = standardMaterial //OUTER


            this.scene.add(this.model)
            this.scene.add(this.plane)
            this.createShaderPlane()
            this.setupScene()
            this.renderer.render(this.scene, this.camera)
            return this.scene

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

        return this.camera
    }

    run(model) {
        this.renderer.setAnimationLoop(() => {
            if (model) {
                model.rotation.y += 0.1 // Speed it up slightly
            }
            if (this.shaderMaterial) {
                this.shaderMaterial.uniforms.iTime.value += 0.004
            }
            this.renderer.render(this.scene, this.camera)
        })
    }


    createShaderPlane() {

        const vertexShaderSource =
            `
            varying vec2 vUv;
            void main() {
                vUv = uv; // Pass UVs to fragment shader
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `

        const fragmentShaderSource =
            `
            precision highp float;
            uniform vec2 iResolution;
            uniform float iTime;
            varying vec2 vUv; // Use this to center the effect on the plane

            #define time iTime
            const float PI = 3.1415925358;

            float safety_sin( in float x ) { return sin( mod( x, PI ) ); }

            float rand( vec2 p ) { 
                return fract( safety_sin( dot(p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 + time * .35 ); 
            }

            float noise( vec2 x ) {
                vec2 i = floor(x);
                vec2 f = fract(x);
                vec4 h;
                // Smooth Interpolation
                f = f * f * ( f * -2.0 + 3.0 );
                // Four corners in 2D of a tile
                h.x = rand( i + vec2( 0., 0. ) );
                h.y = rand( i + vec2( 1., 0. ) );
                h.z = rand( i + vec2( 0., 1. ) );
                h.w = rand( i + vec2( 1., 1. ) );
                // Mix 4 corners percentages
                return mix( mix( h.x, h.y, f.x ), mix( h.z, h.w, f.x ), f.y );
            }

            float star_burst( vec2 p ) {
                float k0 = 2.0; float k1 = 1.0; float k2 = 0.5; float k3 = 12.0;
                float k4 = 12.0; float k5 = 2.0; float k6 = 5.2; float k7 = 4.0; float k8 = 6.2;
                
                float l  = length( p );
                float l2 = pow( l * k1, k2 );
                float n0 = noise( vec2( atan(  p.y,  p.x ) * k0, l2 ) * k3 );
                float n1 = noise( vec2( atan( -p.y, -p.x ) * k0, l2 ) * k3 );
                float n  = pow( max( n0, n1 ), k4 ) * pow( clamp( 1.0 - l * k5, 0.0, 1.0 ), k6 );
                n += pow( clamp( 1.0 - ( l * k7 - 0.1 ), 0.0, 1.0 ), k8 );
                return n;
            }



            void main() {
                // Use vUv (0.0 to 1.0) instead of gl_FragCoord so it scales with the plane
                vec2 p = vUv - 0.5; 
                p.x *= iResolution.x / iResolution.y; // Maintain aspect ratio

                p *= 0.5;
                
                float r = star_burst( p * 1.1 );
                float g = star_burst( p );
                float b = star_burst( p * 0.9 );

                vec3 starColor = vec3(r, g, b);
                vec3 col = pow( starColor, vec3( 1.0 / 3.5 ) );
                float brightness = max(col.r, max(col.g, col.b));

                float margin = 0.2; 
                vec2 edge = smoothstep(0.0, margin, vUv) * smoothstep(1.0, 1.0 - margin, vUv);
                float alphaMask = edge.x * edge.y;

                float finalAlpha = brightness * alphaMask;
                
                gl_FragColor = vec4(col, finalAlpha);
            }
        `

        this.shaderMaterial.vertexShader = vertexShaderSource
        this.shaderMaterial.fragmentShader = fragmentShaderSource
        this.shaderMaterial.transparent = true
        this.shaderMaterial.blending = THREE.AdditiveBlending
        this.shaderMaterial.depthWrite = false

        let planeGeometry = new THREE.PlaneGeometry(3, 2)
        let planeMesh = new THREE.Mesh(planeGeometry, this.shaderMaterial)
        this.plane.add(planeMesh)
    }

    scrollHomeAnimation() {
        /*
        gsap.to(this.scene.position, {
            y: 0,
            z: 0,
            duration: 1,
            ease: 'expo.inOut'
        }) */

        let home = gsap.timeline({
            id: 'homeScrolltrigger',
            scrollTrigger: {
                id: "homeScrolltrigger",
                trigger: this.container,
                start: 'bottom 75%',
                end: 'bottom top',
                scrub: 1,
                //markers: true
            }
        })

        home.to(this.scene.position, {
            y: 1.8,
            z: -3.5
        })

        home.to(this.plane.position, {
            y: 0.3
        }, "<")

        home.to(this.plane.scale, {
            y: 1,
            x: 1,
            z: 1,
        }, "<")

    }

    destroyHomeAnimation() {
        let timeline = gsap.getById('homeScrolltrigger')
        //timeline.revert()
        timeline.kill()
        this.animateToHeader()
    }

    animateToHeader() {
        gsap.to(this.scene.position, {
            y: 1.8,
            z: -3.5
        })
        gsap.to(this.plane.scale, {
            y: 1,
            x: 1,
            z: 1,
            ease: 'expo.inOut',
            duration: 1
        }, "<")
        gsap.to(this.plane.position, {
            y: 0.3,
            ease: 'expo.inOut',
            duration: 1
        }, "<")

    }

    animateToMenu(timeline) {
        timeline.clear()
        timeline.to(this.scene.position, {
            y: 0.5,
            z: -2,
            ease: 'expo.inOut',
            duration: 1
        })
        timeline.to(this.plane.scale, {
            y: 1.8,
            x: 1.8,
            z: 1.8,
            ease: 'expo.inOut',
            duration: 1
        }, "<")
        timeline.to(this.plane.position, {
            y: 0,
            ease: 'expo.inOut',
            duration: 1
        }, "<")
    }

    revertMenuAnimation(timeline) {
        timeline.reverse()
    }

    setToHeader() {
        gsap.set(this.scene.position, {
            y: 1.8,
            z: -3.5
        })
        gsap.set(this.plane.position, {
            y: 0.3,
            ease: 'expo.inOut',
            duration: 1
        }, "<")
        gsap.set(this.plane.scale, {
            y: 1,
            x: 1,
            z: 1,
            ease: 'expo.inOut',
            duration: 1
        }, "<")
    }

}