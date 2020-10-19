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
  Preloader.finish();
}

const $wrapper = document.querySelector('.wrapper');
const $header = document.querySelector('.header');
const $body = document.body;

const brakepoints = {
  sm: 576,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1620
}
const speed = 1; //s

const App = {
  init: function() {
    TouchHoverEvents.init();
    if(document.querySelector('.home')) {
      Home.init();
    }
    Header.init();
    Nav.init();
  }
}


const Preloader = {
  min_loading_time: speed*2, 
  finish_speed: speed, 
  finish: function() {
    //this.min_loading_time = 0;
    //this.finish_speed = 0;
    let delay = Math.max(this.min_loading_time-loading_duration/1000, 0);

    this.animation = gsap.timeline({paused:true})
      .set([$prelaoder, $images, $chars], {css:{transition:'none'}})
      .to($images, {autoAlpha:0, duration:this.finish_speed, ease:'power2.inOut'})
      .to($chars, {autoAlpha:0, duration:this.finish_speed*0.75, ease:'power2.inOut', stagger:{amount:this.finish_speed*0.25, from:'random'}}, `-=${this.finish_speed}`)
      .set($prelaoder, {autoAlpha:0})

    setTimeout(()=>{
      $body.classList.add('loaded');
      this.animation.play();
    }, delay*1000)

    this.animation.eventCallback('onComplete', ()=> {
      App.init();
      gsap.to($wrapper, {autoAlpha:1, duration:this.finish_speed, ease:'power2.inOut'})
      $prelaoder.remove();
    })

  }
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
      new THREE.TextureLoader().load('./img/roberto-nickson-so3wgJLwDxo-unsplash 4.jpg', function() {
        init();
        animate();
      }),
      new THREE.TextureLoader().load('./img/roberto-nickson-so3wgJLwDxo-unsplash 2.jpg'),
      new THREE.TextureLoader().load('./img/roberto-nickson-so3wgJLwDxo-unsplash 3.jpg'),
      new THREE.TextureLoader().load('./img/roberto-nickson-so3wgJLwDxo-unsplash 2 (1).jpg'),
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
    $container.addEventListener('click', ()=>{
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

const Nav = {
  init: function() {
    this.$nav = document.querySelector('.nav');
    this.$toggle = document.querySelector('.nav-toggle');
    this.$toggle_items = this.$toggle.querySelectorAll('path');
    this.button_forms = [
      'M0.3,2.8c0,0,5.5-1.2,9.8-1.2c4.4,0,8.6,2.5,13.4,2.5s11-1.2,11-1.2',
      'M0.3,2.8c0,0,5.5,0,9.8,0c4.4,0,8.6,0,13.4,0s11,0,11,0',
      'M0.3,2.8c0,0,5.5,1.2,9.8,1.2c4.4,0,8.6-2.5,13.4-2.5s11,1.2,11,1.2'
    ]

  
    this.$toggle.addEventListener('mouseenter', (event)=>{this.checkToggleButton(event)})
    this.$toggle.addEventListener('mouseleave', (event)=>{this.checkToggleButton(event)})
    this.$toggle.addEventListener('touchstart', (event)=>{this.checkToggleButton(event)})
    this.$toggle.addEventListener('customTouchend', (event)=>{this.checkToggleButton(event)})

    this.setSize();
    window.addEventListener('resize', (event)=>{this.setSize()});

  },
  checkToggleButton: function(event) {
    if((event.type=='mouseenter' && !TouchHoverEvents.touched) || event.type=='touchstart') {
      this.$toggle_items.forEach(($item, index)=>{
        $item.setAttribute('d', this.button_forms[2])
      })
    } 
    
    else if(event.type=='mouseleave' || event.type=='customTouchend') {
      this.$toggle_items.forEach(($item)=>{
        $item.setAttribute('d', this.button_forms[0])
      })
    }
  },
  setSize: function() {
    let w = window.innerWidth,
        cw = document.querySelector('.container').getBoundingClientRect().width,
        w2 = (w-cw)/2,
        nw = this.$nav.querySelector('.nav__container').getBoundingClientRect().width;
        
        this.$nav.style.width = `${nw+w2}px`
  }
}

const Header = {
  init: function() {
    this.height = $header.getBoundingClientRect().height;
    this.scrollY = 0;
    this.isFixed = false;
    this.isVisible = false;

    this.animation = gsap.timeline({paused:true})
      .to($header, {yPercent:100, duration:speed, ease:'power2.out'})

    window.addEventListener('resize', ()=>{
      this.height = $header.getBoundingClientRect().height;
    })
    window.addEventListener('scroll', ()=>{
      this.check();
    })
    this.check();
  }, 
  check: function() {
    let y = window.pageYOffset,
        h = window.innerHeight/2,
        h2 = window.innerHeight;
    
    if(y>=h && !this.isFixed && !this.animation.isActive()) {
      console.log('1')
      $header.classList.add('fixed');
      this.isFixed = true;
    } else if((y<h && this.isFixed && !this.isVisible && !this.animation.isActive()) || (y<=this.height && this.animation.isActive())) {
      if(y<=this.height && this.animation.isActive()) {
        this.animation.seek(0);
      }
      console.log('2')
      $header.classList.remove('fixed');
      this.isFixed = false;
    }

    if(this.scrollY<y && this.isVisible) {
      console.log('3')
      this.isVisible = false;
      this.animation.timeScale(2).reverse();
    } else if(this.scrollY>y && this.isFixed) {
      if(!this.isVisible && y>=h2) {
        console.log('4')
        this.isVisible = true;
        this.animation.timeScale(1).play();
      } else if(y<h && this.isVisible) {
        console.log('5')
        this.isVisible = false;
        this.animation.timeScale(2).reverse();
      }
    } 

    this.scrollY = y;
  }
}

/* let t = document.querySelector('#test path');
let state = 0;
t.addEventListener('click', (event)=>{
  let values = [
    'M0.3,2.8c0,0,5.5-1.2,9.8-1.2c4.4,0,8.6,2.5,13.4,2.5s11-1.2,11-1.2',
    'M0.3,2.8c0,0,5.5,0,9.8,0c4.4,0,8.6,0,13.4,0s11,0,11,0',
    'M0.3,2.8c0,0,5.5,1.2,9.8,1.2c4.4,0,8.6-2.5,13.4-2.5s11,1.2,11,1.2'
  ]

  state++;
  if(state>2) {
    state=0;
  }
  t.setAttribute('d', values[state])
}) */