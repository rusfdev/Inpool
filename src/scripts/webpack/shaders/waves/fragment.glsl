uniform float time;
uniform sampler2D img;
uniform float waveLength;
uniform vec2 resolution;
uniform vec2 mouse;
varying vec2 vUv;
varying vec4 vPosition;

void main() {
  vec2 p = 7.68*(gl_FragCoord.xy/resolution.xy - vec2(0.5, 1.0)) - vec2(mouse.x,-15);
  vec2 i = p;

  float c = 1.;

  for(int n = 0; n<4; n++) {
    float t = time*(1.0 - (10./float(n+10)));
    float ix = i.x + mouse.x;
    float iy = i.y + mouse.y;
    i = vec2(cos(t-ix) + sin(t+iy), sin(t-iy) + cos(t+ix)) + p;
    c += float(n)/length(vec2(p.x/sin(t+ix)/1.1, p.y/cos(t+i.y)/1.1)) * 20.;
  }

  c/=200.;
  c = 1.8 - sqrt(c);

  vec4 img = texture2D(img, vec2(vUv.x + cos(c)*mouse.x*0.05, vUv.y + cos(c)*mouse.y*0.05));

  gl_FragColor = (img*c*c)/3.;
}