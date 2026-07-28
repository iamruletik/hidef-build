import { gsap } from '../core/gsap'
import barba from '@barba/core'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

//Scatter shader convergence point, quad-local uv space: x/y both range roughly -1..1, (0,0) is
//dead center of the plane. Positive y = up, positive x = right. Tweak these two to move it
const SCATTER_BALL_X = 0.0
const SCATTER_BALL_Y = 0.5

//More scatter shader knobs — all fed into the GLSL below as float literals
const SCATTER_SPIN = -0.05          //rotation speed/direction — negative = counter-clockwise
const SCATTER_ROWS = 34             //light bands around the sphere — higher = more dots
const SCATTER_KILL_TOP = 0.18       //fraction of dots culled near the top, where blobs are small
const SCATTER_KILL_BOTTOM = 0.72    //fraction culled at the bottom — blobs are bigger there, so fewer needed
const SCATTER_SIZE_NEAR = 0.014     //blob radius near the ball (uv units)
const SCATTER_SIZE_FAR = 0.07       //blob radius at the bottom — nudged up a bit from 0.055
const SCATTER_STRETCH_BOTTOM = 2.0  //radial elongation at the bottom — was 3.0, compounded the size overlap
const SCATTER_DOT_REACH = 9.0       //max squared distance before a dot stops rendering — lower shrinks each
                                     //dot's visible footprint, keeping dense bands from fusing into a line
const SCATTER_LATITUDE_JITTER = 0.14 //radians — per-facet latitude offset, breaks the shared-ring pattern
const SCATTER_CELL_RES = 5.0        //cellular variant only — 3D grid density, higher = more candidate points
const SCATTER_CA_NEAR = 0.010       //chromatic split near the ball (dispersion)
const SCATTER_CA_FAR = 0.032        //chromatic split far from the ball
const SCATTER_BLOOM_RADIUS = 1.8    //extra glow falloff divisor — higher = wider, softer bloom
const SCATTER_BLOOM_INTENSITY = 0.5 //extra glow layer strength
const SCATTER_EDGE_MARGIN = 0.35    //uv-space fraction where the effect fades out at the plane edges

//GLSL float literals need a decimal point or the compiler reads them as int — guarantees one
function glFloat(value) {
    return Number(value).toFixed(4)
}

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
                iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                //Scatter shader uniforms (see createShaderPlane) — uBall is the convergence point in uv space
                uTime: { value: 0.0 },
                uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uBall: { value: new THREE.Vector2(SCATTER_BALL_X, SCATTER_BALL_Y) }
            }
        })
    }


    async loadModel(contents) {

        const loader = new GLTFLoader()
        const draco = new DRACOLoader()
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
        loader.setDRACOLoader(draco)

        try {
            const gltf = await loader.parseAsync(contents, '')
            this.model = gltf.scene
            draco.dispose()
            

            const standardMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0xffffff),
                roughness: 0.1,
                metalness: 1,
                //flatShading: true
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
            throw error
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
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.toneMappingExposure = 1.2
        this.renderer.setClearColor(0x000000, 0)
        this.container.appendChild(this.renderer.domElement)


        window.addEventListener('resize', () => {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight
            this.camera.updateProjectionMatrix()
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
        })

        //≤991: shrink the whole disco to 0.7. scene.scale multiplies every child, so the plane's
        //animated header/menu scales (1, 1.8) come out at 0.7 / 1.26 automatically — no need to
        //edit each animation. Reverts to full above 991; live on resize/rotation.
        gsap.matchMedia().add("(max-width: 991px)", () => {
            this.scene.scale.setScalar(0.7)
            //Lift the smaller ball a touch. scene.position.y is animated (scrub/header/menu) so an
            //offset there wouldn't stick — pan the camera + its target down by 0.1 instead, which
            //shifts the ball up in-frame across every pose.
            return () => {
                this.scene.scale.setScalar(1)
                this.camera.position.y = 0
                this.camera.lookAt(0, 0, 0)
            }
        })

        return this.camera
    }

    run(model) {
        this.renderer.setAnimationLoop((time) => {
            if (model) {
                model.rotation.y += 0.1 // Speed it up slightly
            }
            if (this.shaderMaterial) {
                this.shaderMaterial.uniforms.iTime.value += 0.004
                //Scatter shader — real seconds, driven off the loop's own timestamp
                this.shaderMaterial.uniforms.uTime.value = time * 0.001
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

        //Original light shader — saved so it can be swapped back in below. Not currently used
        const lightFragmentShaderSource =
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

        //Scatter shader (disco-scatter-sketch-v11.html) — temporary swap-in. To revert to the light
        //shader, set this.shaderMaterial.fragmentShader = lightFragmentShaderSource instead
        const scatterFragmentShaderSource =
            `
            precision highp float;
            uniform float uTime;
            uniform vec2  uRes;
            uniform vec2  uBall; // convergence point, uv space
            varying vec2  vUv; // quad-local UV — keeps the pattern locked to the plane, not the screen
            #define PI 3.14159265

            #define SPIN       ${glFloat(SCATTER_SPIN)}
            #define SPREAD     1.35
            #define ROWS       ${glFloat(SCATTER_ROWS)}
            #define KILL_TOP    ${glFloat(SCATTER_KILL_TOP)}
            #define KILL_BOTTOM ${glFloat(SCATTER_KILL_BOTTOM)}
            #define WARP       0.04
            #define SIZE_NEAR  ${glFloat(SCATTER_SIZE_NEAR)}
            #define SIZE_FAR   ${glFloat(SCATTER_SIZE_FAR)}
            #define STRETCH_TOP  1.1
            #define STRETCH_BOT  ${glFloat(SCATTER_STRETCH_BOTTOM)}
            #define CA_NEAR      ${glFloat(SCATTER_CA_NEAR)}
            #define CA_FAR       ${glFloat(SCATTER_CA_FAR)}
            #define GATE_NEAR  1.5
            #define GATE_FAR   7.0
            #define DOT_REACH  ${glFloat(SCATTER_DOT_REACH)}
            #define LATITUDE_JITTER ${glFloat(SCATTER_LATITUDE_JITTER)}
            #define BLOOM_RADIUS    ${glFloat(SCATTER_BLOOM_RADIUS)}
            #define BLOOM_INTENSITY ${glFloat(SCATTER_BLOOM_INTENSITY)}
            #define EDGE_MARGIN     ${glFloat(SCATTER_EDGE_MARGIN)}

            mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
            float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

            float spot(vec2 uv, float ch){
              vec2 rel = uv - uBall;

              float w = length(rel);
              rel += WARP * w * vec2(sin(rel.y * 5.0 + uTime * 0.10),
                                     cos(rel.x * 4.0 - uTime * 0.08));

              vec3 P = vec3(rel * SPREAD, 1.4);
              vec3 d = normalize(P);
              vec3 L = normalize(vec3(0.0, -0.35, 1.0));

              float t = uTime * SPIN;
              vec3 n  = normalize(d - L);
              vec3 nl = rotY(-t) * n;

              float phi   = acos(clamp(nl.y, -1.0, 1.0));
              float th    = atan(nl.z, nl.x);
              float band0 = floor(phi / PI * ROWS);
              mat3 R      = rotY(t);

              float acc = 0.0;
              for (int db = -2; db <= 2; db++){
                float band = band0 + float(db);
                if (band < 0.0 || band >= ROWS) continue;

                float phic = (band + 0.5) / ROWS * PI;
                float cols = max(3.0, floor(ROWS * 2.0 * sin(phic)));
                float col0 = floor((th / (2.0 * PI) + 0.5) * cols);

                float poleFade = smoothstep(0.10, 0.30, sin(phic));
                if (poleFade <= 0.0) continue;

                for (int dc = -2; dc <= 2; dc++){
                  float col = mod(col0 + float(dc), cols);
                  float thc = ((col + 0.5) / cols - 0.5) * 2.0 * PI;

                  //Facets in the same band share one latitude, so rotating around Y alone would
                  //make every one of them trace the identical reflected-highlight arc on screen —
                  //this jitter gives each facet its own latitude so dots stop lining up into a ring
                  float id = hash(vec2(band, col));
                  float phicFacet = phic + (id - 0.5) * LATITUDE_JITTER;

                  vec3 nc = R * vec3(sin(phicFacet) * cos(thc), cos(phicFacet), sin(phicFacet) * sin(thc));
                  vec3 rd = reflect(L, nc);
                  if (rd.z < 0.10) continue;

                  vec2 hit = rd.xy * (1.4 / rd.z) / SPREAD;
                  float fd = length(hit);

                  vec2 er = hit / max(fd, 1e-4);
                  vec2 et = vec2(-er.y, er.x);

                  float by = hit.y + uBall.y;
                  float botW = smoothstep(-0.9, 0.5, by);
                  float stretch = mix(STRETCH_BOT, STRETCH_TOP, botW);
                  float sz = mix(SIZE_FAR, SIZE_NEAR, botW);
                  sz *= 0.7 + 0.7 * fract(id * 7.31);

                  float ca = mix(CA_NEAR, CA_FAR, smoothstep(0.3, 2.0, fd));
                  vec2 dp = rel - hit - er * ca * ch;

                  float rr = dot(dp, er) / (sz * stretch);
                  float tt = dot(dp, et) / sz;
                  float d2 = rr * rr + tt * tt;
                  if (d2 > DOT_REACH) continue;

                  float killThreshold = mix(KILL_BOTTOM, KILL_TOP, botW);
                  float alive = step(killThreshold, id);
                  float flick = 0.7 + 0.3 * sin(uTime * (0.25 + id * 1.2) + id * 80.0);

                  float bd2   = dot(vec3(hit * SPREAD, 1.4), vec3(hit * SPREAD, 1.4));
                  float farW  = smoothstep(GATE_NEAR, GATE_FAR, bd2);
                  float pulse = smoothstep(0.35, 0.6, 0.5 + 0.5 * sin(uTime * (0.10 + id * 0.3) + id * 40.0));
                  float gate  = mix(1.0, pulse, farW);

                  float s = exp(-d2 * 4.0) * 0.9
                          + exp(-d2 * 0.8) * 0.30
                          + exp(-d2 / BLOOM_RADIUS) * BLOOM_INTENSITY;
                  s *= 2.4 / (1.0 + bd2 * 0.8);

                  acc += s * poleFade * alive * flick * gate;
                }
              }

              return acc;
            }

            void main(){
              //Quad-local space instead of gl_FragCoord — same range convention (-aspect..aspect, -1..1)
              //but tied to the plane's own UV so the pattern travels with it (menu pose, scroll, etc.)
              vec2 uv = (vUv - 0.5) * 2.0;
              uv.x *= uRes.x / uRes.y;

              vec3 c = vec3(
                spot(uv, -1.0),
                spot(uv,  0.0),
                spot(uv,  1.0) * 1.04
              );

              c = min(c, vec3(1.0));

              //Gradual falloff at the plane edges instead of a hard cut — same trick as the light shader
              vec2 edge = smoothstep(0.0, EDGE_MARGIN, vUv) * smoothstep(1.0, 1.0 - EDGE_MARGIN, vUv);
              float edgeMask = edge.x * edge.y;

              gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * edgeMask);
            }
        `

        //Cellular variant — same reflection/blob math as scatterFragmentShaderSource, but candidate
        //facets come from a 3D cell hash instead of a lat/long grid. Every cell gets its own randomized
        //point, so there's no shared band/ring to fuse into a line (no LATITUDE_JITTER patch needed).
        //To try it: change the assignment below from scatterFragmentShaderSource to this
        const cellularFragmentShaderSource =
            `
            precision highp float;
            uniform float uTime;
            uniform vec2  uRes;
            uniform vec2  uBall;
            varying vec2  vUv;
            #define PI 3.14159265

            #define SPIN       ${glFloat(SCATTER_SPIN)}
            #define SPREAD     1.35
            #define CELL_RES   ${glFloat(SCATTER_CELL_RES)}
            #define KILL_TOP    ${glFloat(SCATTER_KILL_TOP)}
            #define KILL_BOTTOM ${glFloat(SCATTER_KILL_BOTTOM)}
            #define WARP       0.04
            #define SIZE_NEAR  ${glFloat(SCATTER_SIZE_NEAR)}
            #define SIZE_FAR   ${glFloat(SCATTER_SIZE_FAR)}
            #define STRETCH_TOP  1.1
            #define STRETCH_BOT  ${glFloat(SCATTER_STRETCH_BOTTOM)}
            #define CA_NEAR      ${glFloat(SCATTER_CA_NEAR)}
            #define CA_FAR       ${glFloat(SCATTER_CA_FAR)}
            #define GATE_NEAR  1.5
            #define GATE_FAR   7.0
            #define DOT_REACH  ${glFloat(SCATTER_DOT_REACH)}
            #define BLOOM_RADIUS    ${glFloat(SCATTER_BLOOM_RADIUS)}
            #define BLOOM_INTENSITY ${glFloat(SCATTER_BLOOM_INTENSITY)}
            #define EDGE_MARGIN     ${glFloat(SCATTER_EDGE_MARGIN)}

            mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
            float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

            float spot(vec2 uv, float ch){
              vec2 rel = uv - uBall;

              float w = length(rel);
              rel += WARP * w * vec2(sin(rel.y * 5.0 + uTime * 0.10),
                                     cos(rel.x * 4.0 - uTime * 0.08));

              vec3 P = vec3(rel * SPREAD, 1.4);
              vec3 d = normalize(P);
              vec3 L = normalize(vec3(0.0, -0.35, 1.0));

              float t = uTime * SPIN;
              vec3 n  = normalize(d - L);
              vec3 nl = rotY(-t) * n; // query direction in the sphere's non-spinning local frame
              mat3 R  = rotY(t);

              //3D cell containing this query direction, plus its neighbors — same "check a small
              //fixed neighborhood, not everything" trick as the lat/long version, just in 3D instead of 2D
              vec3 cell0 = floor(nl * CELL_RES);

              float acc = 0.0;
              for (int ix = -1; ix <= 1; ix++){
                for (int iy = -1; iy <= 1; iy++){
                  for (int iz = -1; iz <= 1; iz++){
                    vec3 cell = cell0 + vec3(float(ix), float(iy), float(iz));

                    //Random point inside this cell, projected onto the unit sphere. Every cell is
                    //independent — no two candidates share a latitude/ring by construction
                    float h1 = hash(cell.xy + cell.z * 13.7);
                    float h2 = hash(cell.yz + cell.x * 9.1);
                    float h3 = hash(cell.zx + cell.y * 5.3);
                    vec3 candidate = (cell + vec3(h1, h2, h3)) / CELL_RES;
                    float clen = length(candidate);
                    if (clen < 0.001) continue;
                    vec3 nc = R * (candidate / clen);

                    float id = hash(cell.xy * 3.1 + cell.z * 7.9);

                    vec3 rd = reflect(L, nc);
                    if (rd.z < 0.10) continue;

                    vec2 hit = rd.xy * (1.4 / rd.z) / SPREAD;
                    float fd = length(hit);

                    vec2 er = hit / max(fd, 1e-4);
                    vec2 et = vec2(-er.y, er.x);

                    float by = hit.y + uBall.y;
                    float botW = smoothstep(-0.9, 0.5, by);
                    float stretch = mix(STRETCH_BOT, STRETCH_TOP, botW);
                    float sz = mix(SIZE_FAR, SIZE_NEAR, botW);
                    sz *= 0.7 + 0.7 * fract(id * 7.31);

                    float ca = mix(CA_NEAR, CA_FAR, smoothstep(0.3, 2.0, fd));
                    vec2 dp = rel - hit - er * ca * ch;

                    float rr = dot(dp, er) / (sz * stretch);
                    float tt = dot(dp, et) / sz;
                    float d2 = rr * rr + tt * tt;
                    if (d2 > DOT_REACH) continue;

                    float killThreshold = mix(KILL_BOTTOM, KILL_TOP, botW);
                    float alive = step(killThreshold, id);
                    float flick = 0.7 + 0.3 * sin(uTime * (0.25 + id * 1.2) + id * 80.0);

                    float bd2   = dot(vec3(hit * SPREAD, 1.4), vec3(hit * SPREAD, 1.4));
                    float farW  = smoothstep(GATE_NEAR, GATE_FAR, bd2);
                    float pulse = smoothstep(0.35, 0.6, 0.5 + 0.5 * sin(uTime * (0.10 + id * 0.3) + id * 40.0));
                    float gate  = mix(1.0, pulse, farW);

                    float s = exp(-d2 * 4.0) * 0.9
                            + exp(-d2 * 0.8) * 0.30
                            + exp(-d2 / BLOOM_RADIUS) * BLOOM_INTENSITY;
                    s *= 2.4 / (1.0 + bd2 * 0.8);

                    acc += s * alive * flick * gate;
                  }
                }
              }

              return acc;
            }

            void main(){
              vec2 uv = (vUv - 0.5) * 2.0;
              uv.x *= uRes.x / uRes.y;

              vec3 c = vec3(
                spot(uv, -1.0),
                spot(uv,  0.0),
                spot(uv,  1.0) * 1.04
              );

              c = min(c, vec3(1.0));

              vec2 edge = smoothstep(0.0, EDGE_MARGIN, vUv) * smoothstep(1.0, 1.0 - EDGE_MARGIN, vUv);
              float edgeMask = edge.x * edge.y;

              gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * edgeMask);
            }
        `

        this.shaderMaterial.vertexShader = vertexShaderSource
        this.shaderMaterial.fragmentShader = scatterFragmentShaderSource
        this.shaderMaterial.transparent = true
        this.shaderMaterial.blending = THREE.AdditiveBlending
        this.shaderMaterial.depthWrite = false

        let planeGeometry = new THREE.PlaneGeometry(3, 2)
        let planeMesh = new THREE.Mesh(planeGeometry, this.shaderMaterial)
        this.plane.add(planeMesh)
    }

    scrollHomeAnimation(onComplete) {

        //Animate scene back to the main-page initial state, then attach the scrub
        let intro = gsap.timeline({
            onComplete: () => {
                this.createHomeScrub()
                if (onComplete) onComplete()
            }
        })

        intro.to(this.scene.position, {
            y: 0,
            z: 0,
            ease: 'power3.inOut',
            duration: 1
        })

       /* intro.to(this.plane.position, {
            y: 0,
            ease: 'expo.inOut',
            duration: 1
        }, "<")

        //Scale too — arriving from the menu pose (scale 1.8) it must ease down, not let the scrub snap it
        intro.to(this.plane.scale, {
            x: 1,
            y: 1,
            z: 1,
            ease: 'expo.inOut',
            duration: 1
        }, "<")*/

    }

    createHomeScrub() {

        let home = gsap.timeline({
            id: 'homeScrolltrigger',
            scrollTrigger: {
                id: "homeScrolltrigger",
                trigger: this.container,
                start: 'bottom bottom',
                end: 'bottom top',
                scrub: 1,
                //markers: true
            }
        })

        home.fromTo(this.scene.position, {
            y: 0,
            z: 0
        }, {
            y: 1.8,
            z: -3.5
        })

       /* home.fromTo(this.plane.position, {
            y: 0
        }, {
            y: 0.3
        }, "<")

        home.fromTo(this.plane.scale, {
            y: 1,
            x: 1,
            z: 1,
        }, {
            y: 1,
            x: 1,
            z: 1,
        }, "<")*/

    }

    destroyHomeAnimation() {
        let timeline = gsap.getById('homeScrolltrigger')
        //timeline.revert()
        if (timeline) timeline.kill()
        return this.animateToHeader()
    }

    animateToHeader() {
        let tl = gsap.timeline()
        //Stored so callers (e.g. index.js's leave() when already leaving main) can hook onto THIS
        //specific run instead of starting a second, concurrent one on the same properties
        this.headerTimeline = tl
        tl.to(this.scene.position, {
            y: 1.8,
            z: -3.5,
            ease: 'expo.inOut',
            duration: 0.7
        })
        tl.to(this.plane.scale, {
            y: 1,
            x: 1,
            z: 1,
            ease: 'expo.inOut',
            duration: 0.7
        }, "<")
        /*tl.to(this.plane.position, {
            y: 0.3,
            ease: 'expo.inOut',
            duration: 0.7
        }, "<")*/

        return tl
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
        /*timeline.to(this.plane.position, {
            y: 0,
            ease: 'expo.inOut',
            duration: 1
        }, "<")*/
    }

    revertMenuAnimation(timeline) {
        timeline.reverse()
    }

    setToHeader() {
        let tl = gsap.timeline()
        tl.set(this.scene.position, {
            y: 1.8,
            z: -3.5
        })
        /*tl.set(this.plane.position, {
            y: 0.3
        }, "<")
        tl.set(this.plane.scale, {
            y: 1,
            x: 1,
            z: 1
        }, "<")*/
    }

}