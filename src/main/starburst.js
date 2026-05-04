export default function starburstInit() {
    const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl", { alpha: true });

if (!gl) {
  alert("WebGL is not supported in your browser.");
}

// 1. Define the Vertex Shader
// This simply creates a flat plane that covers the entire canvas.
const vertexShaderSource = `
      attribute vec2 position;
      void main() {
          gl_Position = vec4(position, 0.0, 1.0);
      }
  `;

// 2. Define the Fragment Shader
// This is your Shadertoy code adapted for standard WebGL.
const fragmentShaderSource = `
      precision highp float;

      uniform vec2 iResolution;
      uniform float iTime;

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
          // Equivalent to Shadertoy's fragCoord
          vec2 fragCoord = gl_FragCoord.xy;
          
          // Dynamically center the coordinates based on the actual screen resolution
          vec2 p = (fragCoord - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y);

          // Keep the author's original zoom/scaling
          p *= 0.5;
          
float r = star_burst( p * 1.1 );
    float g = star_burst( p );
    float b = star_burst( p * 0.9 );

    vec3 starColor = vec3(r, g, b);
    
    // Apply gamma correction
    vec3 col = pow( starColor, vec3( 1.0 / 2.2 ) );

    // Calculate the overall brightness of the pixel
    float brightness = max(col.r, max(col.g, col.b));
    
    // Because we are using default WebGL transparency (premultiplied),
    // passing the bright colors with this alpha will create a true 
    // additive glow over your webpage background.
    gl_FragColor = vec4(col, brightness);
}
  `;

// 3. Compile Shaders and Link Program
function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(
  gl,
  fragmentShaderSource,
  gl.FRAGMENT_SHADER,
);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error("Program linking error:", gl.getProgramInfoLog(program));
}

gl.useProgram(program);

// 4. Set up the geometry (a full-screen quad)
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
// Two triangles to cover the screen
const positions = new Float32Array([
  -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
]);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// 5. Get Uniform Locations
const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
const iTimeLocation = gl.getUniformLocation(program, "iTime");

// 6. Render Loop
function render(time) {
  // Convert time to seconds
  time *= 0.0006;

  // Resize canvas if window size changes
  if (
    canvas.width !== window.innerWidth ||
    canvas.height !== window.innerHeight
  ) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  // Pass uniforms
  gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
  gl.uniform1f(iTimeLocation, time);

  // Draw
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Loop
  requestAnimationFrame(render);
}

// Start the loop
requestAnimationFrame(render);
}