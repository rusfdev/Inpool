//lazylaod
import 'lazysizes';
lazySizes.cfg.preloadAfterLoad = true;
document.addEventListener('lazybeforeunveil', function(e){
  let el = e.target.tagName,
      bg = e.target.getAttribute('data-src');
  if(el!=='IMG') {
    let bg = e.target.getAttribute('data-src');
    e.target.style.backgroundImage = 'url(' + bg + ')';
  }
});
import { gsap } from "gsap";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import vertex from './shaders/vertex.glsl'
import fragment from './shaders/fragment.glsl'
import { PerspectiveCamera } from 'three';


window.onload = function(){
  TouchHoverEvents.init();
  Home.init();
}

const brakepoints = {
  sm: 576,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1620
}

//hover/touch custom events
const TouchHoverEvents = {
  targets: 'a, button, label, tr, .jsTouchHover, .js-3d-object',
  touched: false,
  touchEndDelay: 100, //ms
  init: function() {
    document.addEventListener('touchstart',  (event)=>{this.events(event)});
    document.addEventListener('touchend',    (event)=>{this.events(event)});
    document.addEventListener('mouseenter',  (event)=>{this.events(event)},true);
    document.addEventListener('mouseleave',  (event)=>{this.events(event)},true);
    document.addEventListener('mousedown',   (event)=>{this.events(event)});
    document.addEventListener('mouseup',     (event)=>{this.events(event)});
    document.addEventListener('contextmenu', (event)=>{this.events(event)});
  },
  events: function(event) {
    let $targets = [];
    $targets[0] = event.target!==document?event.target.closest(this.targets):null;
    let $element = $targets[0], i = 0;

    while($targets[0]) {
      $element = $element.parentNode;
      if($element!==document) {
        if($element.matches(this.targets)) {
          i++;
          $targets[i] = $element;
        }
      } 
      else {
        break;
      }
    }

    //touchstart
    if(event.type=='touchstart') {
      this.touched = true;
      if(this.timeout) clearTimeout(this.timeout);
      if($targets[0]) {
        for(let $target of document.querySelectorAll(this.targets)) $target.classList.remove('touch');
        for(let $target of $targets) $target.classList.add('touch');
      }
    } 
    //touchend
    else if(event.type=='touchend' || (event.type=='contextmenu' && this.touched)) {
      this.timeout = setTimeout(() => {this.touched = false}, 500);
      if($targets[0]) {
        setTimeout(()=>{
          for(let $target of $targets) {
            $target.dispatchEvent(new CustomEvent("customTouchend"));
            $target.classList.remove('touch');
          }
        }, this.touchEndDelay)
      }
    } 
    
    //mouseenter
    if(event.type=='mouseenter' && !this.touched && $targets[0] && $targets[0]==event.target) {
      $targets[0].classList.add('hover');
    }
    //mouseleave
    else if(event.type=='mouseleave' && !this.touched && $targets[0] && $targets[0]==event.target) {
      $targets[0].classList.remove('hover', 'focus');
    }
    //mousedown
    if(event.type=='mousedown' && !this.touched && $targets[0]) {
      $targets[0].classList.add('focus');
    } 
    //mouseup
    else if(event.type=='mouseup' && !this.touched  && $targets[0]) {
      $targets[0].classList.remove('focus');
    }
  }
}


const Home = {
  init: function() {
    this.banner();
  },

  banner: function() {
    let $container = document.querySelector('.home-scene');
    let index = 0;
        
    let camera, pos, controls, scene, renderer, geometry, geometry1, material, plane,  
        time=0;

    let destination = {
      x: 0,
      y: 0
    }

    let textures = [
      new THREE.TextureLoader().load('../img/roberto-nickson-so3wgJLwDxo-unsplash 4.jpg', function() {
        init();
        animate();
      }),
      new THREE.TextureLoader().load('../img/roberto-nickson-so3wgJLwDxo-unsplash 2.jpg'),
      new THREE.TextureLoader().load('../img/roberto-nickson-so3wgJLwDxo-unsplash 3.jpg'),
      new THREE.TextureLoader().load('../img/roberto-nickson-so3wgJLwDxo-unsplash 2 (1).jpg'),
    ]
    
    let init = ()=> {
      scene = new THREE.Scene();
      renderer = new THREE.WebGL1Renderer();
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      $container.insertAdjacentElement('afterbegin', renderer.domElement);
      camera = new PerspectiveCamera(
        70, 
        $container.getBoundingClientRect().width/$container.getBoundingClientRect().height,
        0.001,100
      )
      camera.position.set(0, 0, 1);
      //controls = new OrbitControls(camera, renderer.domElement);
      material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: {
          time: {type:'f', value:0},
          waveLength: {type:'f', value:3},
          mouse: {type:'v2', value: new THREE.Vector2()},
          resolution: {type:'v2', value: new THREE.Vector2(window.innerWidth, window.innerHeight)},
          img1: {type:'t', value:textures[index]},
        },
        vertexShader: vertex,
        fragmentShader: fragment
      })
      plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 64, 64), material);
      scene.add(plane);
      window.addEventListener('resize', resize);
      resize();
    }

    let resize = ()=> {
      let w = $container.getBoundingClientRect().width,
          h = $container.getBoundingClientRect().height,
          fov;

      renderer.setSize(w,h);
      camera.aspect = w/h;
      plane.scale.x = (textures[index].image.width/textures[index].image.height);

      if(w/h > plane.scale.x) {
        fov = 2*(180/Math.PI)* (Math.atan((plane.scale.x/2)/(camera.position.z - plane.position.z)/camera.aspect));
      } else {
        fov = 2*(180/Math.PI)*Math.atan((plane.scale.y/2)/(camera.position.z - plane.position.z));
      }   
      camera.fov = fov*0.95; 

      camera.updateProjectionMatrix();
    }

    let animate = ()=> {
      time+=0.05;
      material.uniforms.time.value = time;
      requestAnimationFrame(animate);
      render();
    }

    let render = ()=> {
      material.uniforms.mouse.value.x += (destination.x - material.uniforms.mouse.value.x)*0.05;
      material.uniforms.mouse.value.y += (destination.y - material.uniforms.mouse.value.y)*0.05;
      console.log(material.uniforms.mouse.value.y)
      renderer.render(scene, camera);
    }

    this.mousemoveBannerEvent = (event)=> {
      let ww = window.innerWidth;
      let wh = window.innerHeight;
      let x = (event.clientX - ww/2)/(ww/2);
      let y = (event.clientY - wh/2)/(wh/2);
      destination.x = y;
      destination.y = x;
    }
    window.addEventListener('mousemove', this.mousemoveBannerEvent)


    //change
    document.body.addEventListener('click', ()=>{
      gsap.timeline()
        .to(material.uniforms.waveLength, {value:20, duration:0.5, ease:'power2.out'})
        .to(renderer.domElement, {autoAlpha:0, duration:0.5, ease:'power2.out',
          onComplete:()=>{
            index++;
            if(index>textures.length-1) {
              index=0;
            }
            material.uniforms.img1.value = textures[index];
        }}, '-=0.5')
        .to(renderer.domElement, {autoAlpha:1, duration:0.5, ease:'power2.inOut'})
        .to(material.uniforms.waveLength, {value:3, duration:0.5, ease:'power1.out'}, '-=0.5')
    })

  }
}