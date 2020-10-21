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
//barba
import barba from '@barba/core';
barba.init({
  debug: true,
  //cacheIgnore: true,
  preventRunning: true,
  transitions: [{
    leave(data) {
      barba.done = this.async();
      transitions.exit(data.current.container, data.current.namespace);
    },
    enter(data) {
      transitions.enter(data.next.container, data.next.namespace);
    }
  }]
});
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
gsap.registerPlugin(ScrollToPlugin);
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import vertex from './shaders/vertex.glsl'
import fragment from './shaders/fragment.glsl'
import { PerspectiveCamera } from 'three';
import { disablePageScroll, enablePageScroll } from 'scroll-lock';
import Splitting from "splitting"

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
    this.$container = document.querySelector('[data-barba="container"]');
    this.namespace = this.$container.getAttribute('data-barba-namespace');

    transitions.enter(this.$container, this.namespace);

    Cursor.init();
    TouchHoverEvents.init();
    Header.init();
    Nav.init();
  }
}

const transitions = {
  /* ENTER */
  enter: function($container, namespace) {
    window.dispatchEvent(new Event("change"));
    window.$container = $container;
    $wrapper.classList.remove('disabled');

    /*==== Home =====*/
    if(namespace=='home') {
      Home.init();
    }

    this.animation = gsap.to($container, {duration:speed ,autoAlpha:1, ease:'power2.inOut'});
    
  },
  /* EXIT */
  exit: function($container, namespace) {
    $wrapper.classList.add('disabled');

    if(Nav.state) {
      Nav.close();
    }

    this.animation = gsap.to($container, {duration:speed/2 ,autoAlpha:0, ease:'power2.inOut'});
    
    this.animation.eventCallback('onComplete', ()=>{
      /*==== Home =====*/
      if(namespace=='home') {
        Home.destroy();
      }


      barba.done();
    })

  },
  preventСyclicity: function() {
    document.querySelectorAll('a').forEach(($link)=>{
      let href = $link.getAttribute('href').split('?')[0].split('#')[0];
      if(href==window.location.pathname) {
        $link.setAttribute('data-barba-prevent', '');
      } else {
        $link.removeAttribute('data-barba-prevent');
      }
    })
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
      Cursor.enter();
    }
    //mouseleave
    else if(event.type=='mouseleave' && !this.touched && $targets[0] && $targets[0]==event.target) {
      $targets[0].classList.remove('hover', 'focus');
      Cursor.leave();
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
    Splitting();
    Banner.init();
  },
  destroy: function() {
    Banner.destroy();
  }
}

const Nav = {
  init: function() {
    this.$nav = document.querySelector('.nav');
    this.$toggle = document.querySelector('.nav-toggle');
    this.$toggle_lines = this.$toggle.querySelectorAll('svg');
    this.$toggle_items = this.$toggle.querySelectorAll('path');
    this.$nav_items = document.querySelectorAll('.nav__animate');
    this.state = false;
    this.opened = false;
    this.button_forms = [
      'M0.3,2.8c0,0,5.5-1.2,9.8-1.2c4.4,0,8.6,2.5,13.4,2.5s11-1.2,11-1.2',
      'M0.3,2.8c0,0,5.5,0,9.8,0c4.4,0,8.6,0,13.4,0s11,0,11,0',
      'M0.3,2.8c0,0,5.5,1.2,9.8,1.2c4.4,0,8.6-2.5,13.4-2.5s11,1.2,11,1.2'
    ]
    this.animation = gsap.timeline({paused:true, 
      onStart:()=>{
        this.opened = true;
        this.$toggle_items.forEach(($item, index)=>{
          $item.setAttribute('d', this.button_forms[1])
        })
      }, 
      onReverseComplete:()=>{
        this.opened = false;
        this.$toggle_items.forEach(($item, index)=>{
          $item.setAttribute('d', this.button_forms[0])
        })
      }
    })
      .to(this.$toggle_lines[1], {autoAlpha:0, duration:speed/2, ease:'power2.inOut'})
      .to(this.$toggle_lines[1], {xPercent:-100, duration:speed/2, ease:'power2.in'}, `-=${speed/2}`)
      .to(this.$toggle_lines[0], {rotate:45, y:8.5, duration:speed, ease:'power2.out'}, `-=${speed/2}`)
      .to(this.$toggle_lines[2], {rotate:-45, y:-8.5, duration:speed, ease:'power2.out'}, `-=${speed}`)
      //
      .fromTo(this.$nav, {xPercent:100}, {xPercent:0, duration:speed, ease:'power2.out'}, `-=${speed}`)
      .fromTo(this.$nav_items, {autoAlpha:0}, {autoAlpha:1, duration:speed*0.8, ease:'power2.inOut', stagger:{amount:speed*0.2, from:'random'}}, `-=${speed}`)

    this.$toggle.addEventListener('mouseenter', (event)=>{this.checkToggleButton(event)})
    this.$toggle.addEventListener('mouseleave', (event)=>{this.checkToggleButton(event)})
    this.$toggle.addEventListener('touchstart', (event)=>{this.checkToggleButton(event)})
    this.$toggle.addEventListener('customTouchend', (event)=>{this.checkToggleButton(event)})
    this.$toggle.addEventListener('click', ()=>{
      if(!this.state) {
        this.open();
      } else {
        this.close();
      }
    })

    this.setSize();
    window.addEventListener('resize', (event)=>{this.setSize()});

  },
  checkToggleButton: function(event) {
    if(!this.opened) {
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
    }
  },
  open: function() {
    if(window.pageYOffset<Header.height) {
      gsap.to(window, {duration:speed, scrollTo:0, ease:'power2.inOut'});
    }
    this.state=true;
    this.animation.timeScale(1).play();
    disablePageScroll();
  },
  close: function() {
    this.state=false;
    this.animation.timeScale(2).reverse();
    enablePageScroll();
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
      $header.classList.add('fixed');
      this.isFixed = true;
    } else if((y<h && this.isFixed && !this.isVisible && !this.animation.isActive()) || (y<=this.height && this.animation.isActive())) {
      if(y<=this.height && this.animation.isActive()) {
        this.animation.seek(0);
      }
      $header.classList.remove('fixed');
      this.isFixed = false;
    }

    if(this.scrollY<y && this.isVisible) {
      this.isVisible = false;
      this.animation.timeScale(2).reverse();
    } else if(this.scrollY>y && this.isFixed) {
      if(!this.isVisible && y>=h2) {
        this.isVisible = true;
        this.animation.timeScale(1).play();
      } else if(y<h && this.isVisible) {
        this.isVisible = false;
        this.animation.timeScale(2).reverse();
      }
    } 

    this.scrollY = y;
  }
}

const Banner = {
  init: function() {
    let $block = document.querySelector('.home'),
        $scene = document.querySelector('.home-scene'),
        $slides = $block.querySelectorAll('.home-banner__slide'),
        $paginations = $block.querySelectorAll('.pagination__button');

    let inAnimation = false,
        slide_current = 0,
        slide_old,
        interval_duration = 5,
        interval,
        animations_enter = [],
        animations_exit = [];

    let textures = [];
        
    let camera, scene, renderer, material, plane, time = 0;
    let destination = {x:0, y:0};

    let initScene = (callback)=> {
      scene = new THREE.Scene();
      renderer = new THREE.WebGL1Renderer();
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      $scene.insertAdjacentElement('afterbegin', renderer.domElement);
      camera = new PerspectiveCamera(
        70, 
        $scene.getBoundingClientRect().width/$scene.getBoundingClientRect().height,
        0.001,100
      )
      camera.position.set(0, 0, 1);
      material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: {
          time: {type:'f', value:0},
          waveLength: {type:'f', value:3},
          mouse: {type:'v2', value: new THREE.Vector2()},
          resolution: {type:'v2', value: new THREE.Vector2($scene.getBoundingClientRect().width, $scene.getBoundingClientRect().height)},
          img1: {type:'t', value:textures[slide_current]},
        },
        vertexShader: vertex,
        fragmentShader: fragment
      })
      plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 64, 64), material);
      scene.add(plane);

      window.addEventListener('resize', this.resize);
      window.addEventListener('mousemove', this.mousemove);
      this.resize();

      this.initialized = true;
      if(callback!==undefined) {
        callback();
      }
    }

    let renderScene = ()=> {
      if(this.initialized) {
        time+=0.04;
        material.uniforms.time.value = time;
        material.uniforms.mouse.value.x += (destination.x - material.uniforms.mouse.value.x)*0.025;
        material.uniforms.mouse.value.y += (destination.y - material.uniforms.mouse.value.y)*0.025;
        renderer.render(scene, camera);
        requestAnimationFrame(renderScene);
      }
    }

    this.mousemove = (event)=> {
      let ww = window.innerWidth;
      let wh = window.innerHeight;
      let x = (event.clientX - ww/2)/(ww/2);
      let y = (event.clientY - wh/2)/(wh/2);
      destination.x = y;
      destination.y = x;
    }

    this.resize = ()=> {
      let w = $scene.getBoundingClientRect().width,
          h = $scene.getBoundingClientRect().height,
          fov;

      renderer.setSize(w,h);
      camera.aspect = w/h;
      plane.scale.x = (textures[slide_current].image.width/textures[slide_current].image.height);

      if(w/h > plane.scale.x) {
        fov = 2*(180/Math.PI)* (Math.atan((plane.scale.x/2)/(camera.position.z - plane.position.z)/camera.aspect));
      } else {
        fov = 2*(180/Math.PI)*Math.atan((plane.scale.y/2)/(camera.position.z - plane.position.z));
      }   
      camera.fov = fov*0.9; 

      camera.updateProjectionMatrix();
    }

    let initSlider = ()=> {
      //animations
      
      $slides.forEach(($slide, index)=>{
        let $title_chars = $slide.querySelectorAll('.home-banner__slide-title .char'),
            $text_chars = $slide.querySelectorAll('.home-banner__slide-text .word'),
            $button = $slide.querySelector('.button');

        animations_enter[index] = gsap.timeline({paused:true, onComplete:()=>{
          inAnimation = false;
          if(!interval) {
            interval = setInterval(autoslide ,interval_duration*1000);
          }
        }})
          .set($slide, {autoAlpha:1})
          .set([$title_chars, $text_chars, $button], {y:20, autoAlpha:0})
          //scene
          .fromTo($scene, {autoAlpha:0}, {autoAlpha:1, duration:speed, ease:'power2.inOut'})
          .fromTo(material.uniforms.waveLength, {value:20}, {value:3, duration:speed, ease:'power2.out'}, `-=${speed}`)
          //elements
          .to($title_chars, {y:0, autoAlpha:1, duration:speed*0.8, ease:'power2.out', stagger:{amount:speed*0.2}}, `-=${speed/2}`)
          .to($text_chars, {y:0, autoAlpha:1, duration:speed*0.8, ease:'power2.out', stagger:{amount:speed*0.2}}, `-=${speed*0.9}`)
          .to($button, {y:0, autoAlpha:1, duration:speed*0.8, ease:'power2.out'}, `-=${speed*0.9}`)


        animations_exit[index] = gsap.timeline({paused:true, onStart:()=>{
          inAnimation = true;
        }})
          //scene
          .fromTo(material.uniforms.waveLength, {value:3}, {immediateRender:false, value:15, duration:speed*0.75, ease:'power2.out'})
          .fromTo($scene, {autoAlpha:1}, {immediateRender:false, autoAlpha:0, duration:speed*0.75, ease:'power2.out'}, `-=${speed*0.75}`) 
          //elements
          .to($title_chars, {autoAlpha:0, duration:speed*0.5, ease:'power2.out', stagger:{amount:speed*0.25, from:'random'}}, `-=${speed*0.75}`)
          .to($text_chars, {autoAlpha:0, duration:speed*0.5, ease:'power2.out', stagger:{amount:speed*0.25, from:'random'}}, `-=${speed*0.75}`)
          .to($button, {autoAlpha:0, duration:speed*0.75, ease:'power2.out'}, `-=${speed*0.75}`)
          .set($slide, {autoAlpha:0})
      })

      let change = ()=> {
        if(slide_old!==undefined) {
          $paginations[slide_old].classList.remove('active');
          animations_exit[slide_old].play(0);
          animations_exit[slide_old].eventCallback('onComplete', ()=>{
            material.uniforms.img1.value = textures[slide_current];
            animations_enter[slide_current].play(0);
          })
        } else {
          animations_enter[slide_current].play(0);
        }
        $paginations[slide_current].classList.add('active');
        slide_old = slide_current;
      }

      let autoslide = ()=> {
        slide_current++;
        if(slide_current>$slides.length-1) {
          slide_current=0;
        }
        change();
      }

      $paginations.forEach(($button, index)=>{
        $button.addEventListener('click', ()=>{
          if(!inAnimation) {
            clearInterval(interval);
            interval=false;
            slide_current = index;
            change();
          }
        })
      })
      
      change();
    }

    $slides.forEach(($slide, index)=>{
      let path = $slide.getAttribute('data-image');
      textures[index] = new THREE.TextureLoader().load(path, ()=>{
        //loaded first image event
        if(index==slide_current) {
          initScene(()=>{
            renderScene();
            initSlider();
          });
        }
      });
    })

  },
  destroy: function() {
    this.initialized = false;
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('mousemove', this.mousemove);
  }
}

const Cursor = {
  init: function() {
    this.$parent = document.querySelector('.trigger-round');
    this.$element = document.querySelector('.trigger-round-circle');

    this.width = this.$parent.getBoundingClientRect().width;
    this.height = this.$parent.getBoundingClientRect().height;
    this.c = this.width/2;
    this.r = (this.width/2)-2;
    this.$element.setAttribute('cx', this.c);
    this.$element.setAttribute('cy', this.c);
    this.$element.setAttribute('r', this.r);
    this.circumference = 2*Math.PI*this.r;
    this.$element.setAttribute("style", `stroke-dasharray:${this.circumference} ${this.circumference};stroke-dashoffset:0;`);
    this.flag = true;
    let xStart, yStart;

    gsap.to(this.$parent, {autoAlpha:1, duration:speed, ease:'power2.inOut'})

    document.addEventListener('mousemove',(event)=>{
      let x = event.clientX,
          y = event.clientY,
          moveSpeed,
          timeout;
      //move event
      moveSpeed = Math.sqrt((x-xStart)*(x-xStart)+(y-yStart)*(y-yStart));
      if(this.flag==true) {
        if(moveSpeed>10) {
          clearTimeout(timeout);
          this.$parent.classList.add('move');
          timeout = setTimeout(()=>{
            this.$parent.classList.remove('move');
          },200)
        } else {
          this.$parent.classList.remove('move');
        }
        xStart = x;
        yStart = y;
      }
      //move
      gsap.timeline()
        .to(this.$parent, {duration:speed/2,x:x,y:y,ease:'power2.out'})
    });
    document.addEventListener('mousedown',(event)=>{
      this.$parent.classList.add('focus');
    })
    document.addEventListener('mouseup',(event)=>{
      this.$parent.classList.remove('focus');
    })
    document.addEventListener('mouseleave', (event)=>{
      this.$parent.classList.add('hidden');
    })
    document.addEventListener('mouseenter', (event)=>{
      this.$parent.classList.remove('hidden');
    })

  },
  enter: function() {
    this.$parent.classList.add('hover');
  },
  leave: function() {
    this.$parent.classList.remove('hover');
  }
}