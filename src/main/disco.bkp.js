import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'


export default function discoBallInit() {
  // 1. Setup Scene, Camera, and Renderer
  const container = document.getElementById('disco-container');
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    20,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  );
  camera.position.set(0, 0, 4.5); // Pull camera back on the Z axis

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Important for realistic lighting and reflections
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Force background to be fully transparent
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // 2. Add Simple Lights (Disco lights!)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  const pinkLight = new THREE.PointLight(0xff00aa, 50, 20);
  pinkLight.position.set(2, 2, 2);
  scene.add(pinkLight);

  const blueLight = new THREE.PointLight(0x00aaff, 50, 20);
  blueLight.position.set(-2, -2, 2);
  scene.add(blueLight);

  // 3. Load Custom HDRI
  const rgbeLoader = new HDRLoader();
  rgbeLoader.load("https://storage.googleapis.com/radiance/wooden_studio_17_1k.hdr", function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  });

  // 4. Load the Disco Ball GLB
  let discoBall;
  const gltfLoader = new GLTFLoader();

  // ⚠️ REPLACE THIS URL WITH THE DIRECT LINK TO YOUR HOSTED .GLB FILE ⚠️
  const modelUrl = "https://storage.googleapis.com/radiance/disco_ball_with_colored_lights.glb";

  gltfLoader.load(
    modelUrl,
    function (gltf) {
      discoBall = gltf.scene;

      // Center the model precisely at origin (0,0,0)
      const box = new THREE.Box3().setFromObject(discoBall);
      const center = box.getCenter(new THREE.Vector3());
      discoBall.position.sub(center);
      discoBall.position.y += 0.25;
      scene.add(discoBall);

      //Animate on scroll
      gsap.to(discoBall.position, {
        z: -5,
        y: 2,
        scrollTrigger: {
          trigger: '#mainSection',
          start: 'top top', // when the top of the trigger hits the top of the viewport
          scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
        }
      })

      gsap.to(".webgl_wrapper canvas", {
        opacity: 0,
        scrollTrigger: {
          trigger: '#mainSection',
          start: 'top top', // when the top of the trigger hits the top of the viewport
          scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
        }
      })

      // Lock camera to look exactly at the centered model
      camera.lookAt(0, 0, 0);
    },
    undefined,
    function (error) {
      console.error('An error happened loading the GLB:', error);
    }
  );

  // 5. Handle Window Resize properly
  window.addEventListener('resize', onWindowResize, false);
  function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }



  // 6. Animation Loop (Just rotation, no interaction)
  function animate() {
    requestAnimationFrame(animate);

    // Rotate the disco ball slowly if it has loaded
    if (discoBall) {
      discoBall.rotation.y += 0.0008;
    }

    renderer.render(scene, camera);
  }

  animate();

}


this.gltfLoader.load(this.pathToGLTFScene, (gltf) => {

        //Iterate through all objects from GLTF file and add them to the provided scene
        const children = [...gltf.scene.children]
        for (const child of children) { this.scene.add(child) }

        //Set Shadow for Soccer Field Outer
        let soccerFieldOuter = this.scene.getObjectByName("SoccerFieldOuter")
        soccerFieldOuter.receiveShadow = true

        //Find Soccer Field Object and set it to recieve shadows
        this.soccerField = this.scene.getObjectByName(this.soccerFieldObjectName)
        this.soccerField.receiveShadow = true
        this.soccerField.castShadow = false

        //Find Soccer Inner Stripe
        let soccerFieldStripe = this.scene.getObjectByName("SoccerFieldStripe")
        soccerFieldStripe.material.map.offset.x = 0
        soccerFieldStripe.material.emissiveMap.offset.x = 0
        soccerFieldStripe.material.emissiveIntensity = 10

        //Animate Ads Strip
        gsap.to(soccerFieldStripe.material.map.offset, {
          x: -1,
          repeat: -1,
          ease: "none",
          duration: 20
        })

        //Animate Ads Strip
        gsap.to(soccerFieldStripe.material.emissiveMap.offset, {
          x: -1,
          repeat: -1,
          ease: "none",
          duration: 20
        }) 

        ///Find Soccer Inner Stripe
        let fieldEmission = this.scene.getObjectByName("SoccerField")
        //fieldEmission.material.toneMapped = false
        //fieldEmission.material.emissive = new THREE.Color(0xFF0600)
        fieldEmission.material.emissiveIntensity = 15
        //Animate Ads Strip
        gsap.to(fieldEmission.material, {
          emissiveIntensity: 0,
          repeat: -1,
          yoyo: true,
          duration: 3
        }) 


        //Create Convex Hull Colliders for Specific Objects in the Scene
        //colliderCreator.create(this.objectNames)

        //Save Bottles in the Array
        for (const objectName of this.bottleNames) { 
          let temp = this.scene.getObjectByName(objectName)
          temp.material.alphaTest = 0.1 
          this.bottles.push(temp)
        }


    })



            this.gltfLoader.load(
    
                this.modelLink,
    
                (gltf) => {
    
                    this.discoball = gltf.scene
    
                    const box = new THREE.Box3().setFromObject(this.discoball)
                    const center = box.getCenter(new THREE.Vector3())
                    this.discoball.position.sub(center)
                    this.discoball.position.y += 0.25
                    this.scene.add(this.discoball)
    
    
                    gsap.to(this.discoball.position, {
                        z: -5,
                        y: 2,
                        scrollTrigger: {
                            trigger: '#mainSection',
                            start: 'top top',
                            scrub: 1,
                        }
                    })
    
                    gsap.to(".webgl_wrapper canvas", {
                        opacity: 0,
                        scrollTrigger: {
                            trigger: '#mainSection',
                            start: 'top top',
                            scrub: 1,
                        }
                    })
    
                },
                undefined,
                function (error) {
                    console.error('An error happened loading the GLB:', error);
                }
            )