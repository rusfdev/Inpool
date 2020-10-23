uniform float time;
uniform float waveLength;
uniform vec2 resolutuion;
uniform vec2 mouse;
varying vec2 vUv;
varying vec4 vPosition;

void main() {
  vUv = uv;

  lowp float vWave = sin(time/2. + (position.x + position.y) * waveLength)/1.5;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x - mouse.y*0.025, position.y + mouse.x*0.025, vWave*0.03, 1.0);
}