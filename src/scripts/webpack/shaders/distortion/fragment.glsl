uniform sampler2D img;
uniform sampler2D displacement;
uniform float progress;
varying vec2 vUv;

void main() {
  vec4 displace = texture2D(displacement, vUv);

  vec2 displacedUV = vec2(vUv.x, vUv.y);
  displacedUV.y = mix(vUv.y, displace.r, progress)
  displacedUV.x = mix(vUv.x, displace.r, progress)

  vec4 color = texture2D(img, displacedUV);
  
  gl_FragColor = color;
}