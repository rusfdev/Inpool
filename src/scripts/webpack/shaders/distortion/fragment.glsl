uniform sampler2D img1;
uniform sampler2D img2;
uniform float progress1;
uniform float progress2;
uniform float time;
uniform sampler2D displacement;
varying vec2 vUv;

//new
uniform vec2 resolution;

void main() {

  vec2 p = 7.68*(gl_FragCoord.xy/resolution.xy - vec2(1.0, 1.0)) - vec2(0,-15);
  vec2 i = p;

  float c = 1.;

  for(int n = 0; n<4; n++) {
    float t = time*(1.0 - (10./float(n+10)));
    float ix = i.x;
    float iy = i.y;
    i = vec2(cos(t-ix) + sin(t+iy), sin(t-iy) + cos(t+ix)) + p;
    c += float(n)/length(vec2(p.x/sin(t+ix)/1.1, p.y/cos(t+i.y)/1.1)) * 20.;
  }

  c/=200.;
  c = (1.8 - sqrt(c));

  vec4 img1 = texture2D(img1, vec2(vUv.x + (cos(c)*2.*progress1), vUv.y + (cos(c)*2.*progress1)))*(1.-progress1);
  vec4 img2 = texture2D(img2, vec2(vUv.x + (cos(c)*2.*progress2), vUv.y + (cos(c)*2.*progress2)))*(1.-progress2);
  vec4 img = img1/(1.-progress1 + 1.-progress2) + img2/(1.-progress1 + 1.-progress2);

  gl_FragColor = img;
}