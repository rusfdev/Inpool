//lazylaod
import 'lazysizes';
lazySizes.cfg.expand = 50;
document.addEventListener('lazybeforeunveil', function(e){
  let el = e.target.tagName,
      bg = e.target.getAttribute('data-src');
  if(el!=='IMG') {
    let bg = e.target.getAttribute('data-src');
    e.target.style.backgroundImage = `url('${bg}')`;
  }
});
//barba
import barba from '@barba/core';
barba.init({
  debug: true,
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
import * as THREE from 'three';
//waves
import vertex_waves from './shaders/waves/vertex.glsl'
import fragment_waves from './shaders/waves/fragment.glsl'
//distortion
import vertex_distortion from './shaders/distortion/vertex.glsl'
import fragment_distortion from './shaders/distortion/fragment.glsl'
//
import { PerspectiveCamera } from 'three';
import Splitting from "splitting";
import Scrollbar from 'smooth-scrollbar';

const brakepoints = {
  sm: 576,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1620
}
const dev = false;
const speed = 1;

const $wrapper = document.querySelector('.wrapper');
const $header = document.querySelector('.header');
const $body = document.body;
const namespaces = [
  'home',
  'power',
  'energy',
  'family',
  'balance',
  'technology',
  'equipment',
  'portfolio',
  'contacts'
]

//scroll
const PageScroll = Scrollbar.init($wrapper, {
  damping: 0.2,
});
PageScroll.addListener(()=>{
  localStorage.setItem('scroll', PageScroll.offset.y);
})
if(+localStorage.getItem('scroll')>0) {
  PageScroll.setPosition(0, +localStorage.getItem('scroll'));
}
document.addEventListener('click', (event)=>{
  let $target = event.target!==document?event.target.closest('.scroll-bottom'):null;
  if($target) {
    let y = $target.closest('section').getBoundingClientRect().height;
    gsap.to(PageScroll, {scrollTop:y, duration:speed, ease:'power2.inOut'})
  }
});


window.onload = function(){
  Preloader.finish();
  Cursor.init();
  TouchHoverEvents.init();
  Header.init();
  Nav.init();
  Distortion.init();
  Parralax.init();
}

const App = {
  init: function() {
    this.$container = document.querySelector('[data-barba="container"]');
    this.namespace = this.$container.getAttribute('data-barba-namespace');
    transitions.enter(this.$container, this.namespace);
    if(!dev) {
      Cursor.show();
    }
  }
}

const transitions = {
  /* ENTER */
  enter: function($container, namespace) {
    window.dispatchEvent(new Event("change"));
    window.$container = $container;
    PageScroll.track.yAxis.element.classList.remove('show');
    Nav.change(namespace);
    setTimeout(()=>{
      if(namespace==namespaces[0]) {
        HomePage.init();
      } 
      else if(namespace==namespaces[1] ||
              namespace==namespaces[2] || 
              namespace==namespaces[3] ||
              namespace==namespaces[4]) {
        ConceptPage.init();
      } 
      else if(namespace==namespaces[6]) {
        WaveScene.init();
      }

      this.animation = gsap.to($container, {duration:speed ,autoAlpha:1, ease:'power2.inOut'});
      this.animation.eventCallback('onComplete', ()=>{
        $wrapper.classList.remove('disabled');
      })
      Parralax.check();
    }, 250)
    
  },
  /* EXIT */
  exit: function($container, namespace) {
    $wrapper.classList.add('disabled');
    $header.classList.remove('header_fixed');
    if(Nav.state) {
      Nav.close();
    }
    this.animation = gsap.timeline()
      .to($container, {duration:speed ,autoAlpha:0, ease:'power2.inOut'})
      .to(PageScroll, {scrollTop:0, duration:speed, ease:'power2.inOut'}, `-=${speed}`)

    this.animation.eventCallback('onComplete', ()=>{
      Header.fixed = false;
      /*==== Home =====*/
      if(namespace==namespaces[0]) {
        HomePage.destroy();
      }
      else if(namespace==namespaces[1] ||
              namespace==namespaces[2] || 
              namespace==namespaces[3] ||
              namespace==namespaces[4]) {
        ConceptPage.destroy();
      } 
      else if(namespace==namespaces[6]) {
        WaveScene.destroy();
      }

      barba.done();
    })

  }
}

const Preloader = {
  min_loading_time: speed*2, 
  finish_speed: speed, 
  finish: function() {
    if(dev) {
      this.min_loading_time = 0;
      this.finish_speed = 0;
    }
    let delay = Math.max(this.min_loading_time-loading_duration/1000, 0);

    this.animation = gsap.timeline({paused:true})
      .set([$prelaoder, $images, $chars], {css:{transition:'none'}})
      .set($square, {autoAlpha:1}) 
      .to($images, {autoAlpha:0, duration:this.finish_speed, ease:'power2.inOut'})
      .to($square, {autoAlpha:0, duration:this.finish_speed*0.75, ease:'power2.inOut'})
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
  targets: 'a, button, label, tr, .jsTouchHover, .scrollbar-thumb, .scrollbar-track',
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

const HomePage = {
  init: function() {
    Splitting();
    WaveScene.init(()=>{
      Banner.init();
    });
    ConceptionsSlider.init();
  },
  destroy: function() {
    WaveScene.destroy();
    Banner.destroy();
  }
}

const ConceptPage = {
  init: function() {
    HomeScreenVideo.init();


  },
  destroy: function() {
    HomeScreenVideo.destroy();
  }
}

const Nav = {
  init: function() {
    this.$nav = document.querySelector('.nav');
    this.$bg = document.querySelector('.nav__bg');
    this.$container = document.querySelector('.nav__container');
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
      .set(this.$nav, {autoAlpha:1})
      .to(this.$toggle_lines[1], {autoAlpha:0, duration:speed/2, ease:'power2.inOut'})
      .to(this.$toggle_lines[1], {xPercent:-100, duration:speed/2, ease:'power2.in'}, `-=${speed/2}`)
      .to(this.$toggle_lines[0], {rotate:45, y:8.5, duration:speed, ease:'power2.out'}, `-=${speed/2}`)
      .to(this.$toggle_lines[2], {rotate:-45, y:-8.5, duration:speed, ease:'power2.out'}, `-=${speed}`)
      //
      .fromTo(this.$bg, {autoAlpha:0}, {autoAlpha:1, duration:speed, ease:'power2.out'}, `-=${speed}`)
      .fromTo(this.$container, {xPercent:100}, {xPercent:0, duration:speed, ease:'power2.out'}, `-=${speed}`)
      .fromTo(this.$nav_items, {autoAlpha:0}, {autoAlpha:1, duration:speed*0.8, ease:'power2.inOut', stagger:{amount:speed*0.2, from:'random'}}, `-=${speed}`)

    this.$toggle.addEventListener('mouseenter', (event)=>{this.checkToggleButton(event)})
    this.$toggle.addEventListener('mouseleave', (event)=>{this.checkToggleButton(event)})
    this.$toggle.addEventListener('touchstart', (event)=>{this.checkToggleButton(event)})
    this.$toggle.addEventListener('customTouchend', (event)=>{this.checkToggleButton(event)})
    this.$bg.addEventListener('click', ()=>{
      if(this.state) {
        this.close();
      }
    })
    this.$toggle.addEventListener('click', ()=>{
      if(!this.state) {
        this.open();
      } else {
        this.close();
      }
    })

    this.setSize();
    window.addEventListener('resize', (event)=>{
      this.setSize()
    });
    PageScroll.addListener(()=>{
      this.$nav.style.top = `${PageScroll.offset.y}px`;
    })
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
    $header.classList.add('header_nav-opened');
    this.state=true;
    this.animation.timeScale(1).play();
  },
  close: function() {
    $header.classList.remove('header_nav-opened');
    this.state=false;
    this.animation.timeScale(2).reverse();
  },
  setSize: function() {
    let w = window.innerWidth,
        cw = document.querySelector('.container').getBoundingClientRect().width,
        w2 = (w-cw)/2,
        nw = this.$container.querySelector('.nav__block').getBoundingClientRect().width;
        
        this.$container.style.width = `${nw+w2}px`;
        this.$nav.style.height = `${$wrapper.getBoundingClientRect().height}px`;
  },
  change: function(namespace) {
    if(this.$active_links) {
      this.$active_links.forEach(($link)=>{
        $link.classList.remove('active');
      })
    }
    this.$active_links = document.querySelectorAll(`[data-namespace='${namespace}']`);
    this.$active_links.forEach(($link)=>{
      $link.classList.add('active');
    })
  }
}

const Header = {
  init: function() {
    this.height = $header.getBoundingClientRect().height;
    this.scrollY = 0;
    this.isVisible = true;
    this.fixed = false;

    this.animation = gsap.timeline({paused:true})
      .to($header, {yPercent:-100, duration:speed, ease:'power2.in'})

    window.addEventListener('resize', ()=>{
      this.height = $header.getBoundingClientRect().height;
    })
    PageScroll.addListener(()=>{
      this.check();
    })
    this.check();
  }, 
  check: function() {
    let y = PageScroll.offset.y,
        h = window.innerHeight/2;

    $header.style.top = `${y}px`;

    if(y>0 && !this.fixed) {
      this.fixed = true;
      $header.classList.add('header_fixed');
    } else if(y==0 && this.fixed) {
      this.fixed = false;
      $header.classList.remove('header_fixed');
    }

    if(this.scrollY<y && this.scrollY>h && this.isVisible && !Nav.opened) {
      this.isVisible = false;
      this.animation.timeScale(2).play();
    } else if(this.scrollY>y && !this.isVisible) {
      this.isVisible = true;
      this.animation.timeScale(1).reverse();
    }    

    this.scrollY = y;
  }
}

const Parralax = {
  init: function() {
    this.check();
    PageScroll.addListener(()=>{
      this.check();
    })
  },
  check: function() {
    let $items = document.querySelectorAll('[data-parralax]');
    $items.forEach(($this)=>{
      let y = $this.getBoundingClientRect().y,
          h1 = window.innerHeight,
          h2 = $this.getBoundingClientRect().height,
          scroll = PageScroll.offset.y,
          factor = $this.getAttribute('data-parralax');
      
      let val = ((scroll+h1/2)-(y+scroll+h2/2))*factor;
      gsap.set($this, {y:val})
    })
  }
}

const WaveScene = {
  init: function(callback) {
    this.$scene = document.querySelector('.wave-scene');
    this.images = this.$scene.getAttribute('data-images').split(', ');
    this.textures = [];
    this.index = 0;
    this.h = this.$scene.getBoundingClientRect().height;
    this.w = this.$scene.getBoundingClientRect().width;
    this.time = 0;
    this.minWave = 2;
    this.maxWave = 15;
    this.destination = {x:0, y:0};

    this.mousemove = (event)=> {
      this.destination.x = (event.clientX - window.innerWidth/2)/(window.innerWidth/2);
      this.destination.y = (event.clientY - window.innerHeight/2)/(window.innerHeight/2);
    }
    this.resize = ()=> {
      this.w = this.$scene.getBoundingClientRect().width;
      this.h = this.$scene.getBoundingClientRect().height;
      this.renderer.setSize(this.w, this.h);
      this.camera.aspect = this.w/this.h;
      this.plane.scale.x = (this.textures[this.index].image.width/this.textures[this.index].image.height);
          
      let fov;
      if(this.w/this.h > this.plane.scale.x) {
        fov = 2*(180/Math.PI)* (Math.atan((this.plane.scale.x/2)/(this.camera.position.z - this.plane.position.z)/this.camera.aspect));
      } else {
        fov = 2*(180/Math.PI)*Math.atan((this.plane.scale.y/2)/(this.camera.position.z - this.plane.position.z));
      }   
      this.camera.fov = fov*0.9; 

      this.camera.updateProjectionMatrix();
    }
    this.images.forEach(($image, index)=>{
      this.textures[index] = new THREE.TextureLoader().load($image, ()=>{
        if(index==0) {
          this.initScene(()=>{
            this.render();
            if(callback!==undefined) {
              callback();
            }
          })
        }
      });
    })
  },
  initScene: function(callback) {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGL1Renderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.w, this.h);
    this.$scene.insertAdjacentElement('afterbegin', this.renderer.domElement);
    this.fadeAnimation = gsap.timeline({paused:true}).to(this.$scene, {autoAlpha:1, duration:speed, ease:'power2.inOut'});

    this.camera = new PerspectiveCamera(
      70, 
      this.w/this.h,
      0.001,100
    )
    this.camera.position.set(0, 0, 1);
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        time: {type:'f', value:0},
        waveLength: {type:'f', value:this.minWave},
        mouse: {type:'v2', value: new THREE.Vector2()},
        resolution: {type:'v2', value: new THREE.Vector2(this.w, this.h)},
        img: {type:'t', value:this.textures[this.index]},
      },
      vertexShader: vertex_waves,
      fragmentShader: fragment_waves
    })
    this.plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 64, 64), this.material);
    this.scene.add(this.plane);

    this.resize();

    window.addEventListener('resize', this.resize);
    window.addEventListener('mousemove', this.mousemove);

    this.fadeAnimation.play();
    if(callback!==undefined) {
      callback();
    }
  },
  render: function() {
    this.time+=0.04;
    this.material.uniforms.time.value = this.time;
    this.material.uniforms.mouse.value.x += (this.destination.x - this.material.uniforms.mouse.value.x)*0.025;
    this.material.uniforms.mouse.value.y += (this.destination.y - this.material.uniforms.mouse.value.y)*0.025;
    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(()=>{this.render()});
  },
  destroy: function() {
    cancelAnimationFrame(this.animationFrame);
    this.scene.remove.apply(this.scene, this.scene.children);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('mousemove', this.mousemove);
  }
}

const Banner = {
  init: function() {
    let $block = document.querySelector('.home'),
        $slides = $block.querySelectorAll('.home-banner__slide'),
        $paginations = $block.querySelectorAll('.pagination__button');

    this.animations_enter = [];
    this.animations_exit = [];
    this.inAnimation = false;
    
    let slide_current = 0,
        slide_old,
        interval_duration = 7;

    $slides.forEach(($slide, index)=>{
      let $title_chars = $slide.querySelectorAll('.home-banner__slide-title .char'),
          $text_chars = $slide.querySelectorAll('.home-banner__slide-text .word'),
          $button = $slide.querySelector('.button');

      this.animations_enter[index] = gsap.timeline({paused:true, onComplete:()=>{
        this.inAnimation = false;
        if(!this.interval) {
          this.interval = setInterval(autoslide ,interval_duration*1000);
        }
      }})
        .set($slide, {autoAlpha:1})
        .set([$title_chars, $text_chars, $button], {y:20, autoAlpha:0})
        //scene
        .fromTo(WaveScene.$scene, {autoAlpha:0}, {autoAlpha:1, duration:speed, ease:'power1.inOut'}) //1
        .fromTo(WaveScene.material.uniforms.waveLength, {value:WaveScene.maxWave}, {value:WaveScene.minWave, duration:speed, ease:'power1.out'}, `-=${speed}`) //1.5
        //elements
        .to($title_chars, {y:0, duration:speed, ease:'power2.out', stagger:{amount:speed*0.2}}, `-=${speed}`) // 1.5
        .to($title_chars, {autoAlpha:1, duration:speed, ease:'power2.inOut', stagger:{amount:speed*0.2}}, `-=${speed*1.2}`) // 1.7
        .to($text_chars, {y:0, duration:speed, ease:'power2.out', stagger:{amount:speed*0.2}}, `-=${speed*1.1}`) 
        .to($text_chars, {autoAlpha:1, duration:speed, ease:'power2.inOut', stagger:{amount:speed*0.2}}, `-=${speed*1.2}`) 
        .to($button, {y:0, duration:speed*1.2, ease:'power2.out'}, `-=${speed*1}`)
        .to($button, {autoAlpha:1, duration:speed*1.2, ease:'power2.inOut'}, `-=${speed*1.2}`)


      this.animations_exit[index] = gsap.timeline({paused:true, onStart:()=>{
        this.inAnimation = true;
      }})
        //scene
        .fromTo(WaveScene.material.uniforms.waveLength, {value:WaveScene.minWave}, {immediateRender:false, value:WaveScene.maxWave, duration:speed, ease:'power1.out'})
        .fromTo(WaveScene.$scene, {autoAlpha:1}, {immediateRender:false, autoAlpha:0, duration:speed, ease:'power2.out'}, `-=${speed}`) 
        //elements
        .to($title_chars, {y:-20, duration:speed*0.75, ease:'power1.in', stagger:{amount:speed*0.25}}, `-=${speed}`)
        .to($title_chars, {autoAlpha:0, duration:speed*0.75, ease:'power2.out', stagger:{amount:speed*0.25}}, `-=${speed}`)
        .to($text_chars, {y:-20, duration:speed*0.75, ease:'power1.in', stagger:{amount:speed*0.25}}, `-=${speed}`)
        .to($text_chars, {autoAlpha:0, duration:speed*0.75, ease:'power2.out', stagger:{amount:speed*0.25}}, `-=${speed}`)
        .to($button, {y:-20, duration:speed, ease:'power1.in'}, `-=${speed}`)
        .to($button, {autoAlpha:0, duration:speed, ease:'power2.out'}, `-=${speed}`)
        .set($slide, {autoAlpha:0})
    })

    let change = ()=> {
      if(slide_old!==undefined) {
        $paginations[slide_old].classList.remove('active');
        this.animations_exit[slide_old].play(0);
        this.animations_exit[slide_old].eventCallback('onComplete', ()=>{
          WaveScene.material.uniforms.img.value = WaveScene.textures[slide_current];
          this.animations_enter[slide_current].play(0);
        })
      } else {
        this.animations_enter[slide_current].play(0);
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
        if(!this.inAnimation) {
          clearInterval(this.interval);
          this.interval=false;
          slide_current = index;
          change();
        }
      })
    })
    
    change();

  },
  destroy: function() {
    this.animations_enter.forEach(($this)=>{
      $this.clear();
    })
    this.animations_exit.forEach(($this)=>{
      $this.clear();
    })
    this.inAnimation = false;
    clearInterval(this.interval);
  }
}

const ConceptionsSlider = {
  init: function() {
    this.speed = speed;

    this.$container = document.querySelector('.conceptions__slider');
    this.$slide = document.querySelectorAll('.conceptions-slide');
    

    this.animation = gsap.timeline({paused:true});

    this.$slide.forEach(($slide, index)=>{

      let $index = $slide.querySelector('.conceptions-slide__index'),
          $num = $slide.querySelector('.conceptions-slide__value-index-current'),
          $prevNum = $slide.querySelector('.conceptions-slide__value-index-prev'),
          $nextNum = $slide.querySelector('.conceptions-slide__value-index-next');

      let timeline = gsap.timeline()
        .set($slide, {autoAlpha:1})
        .fromTo($index, {autoAlpha:0}, {autoAlpha:1, duration:this.speed, ease:'power2.inOut'})
        .fromTo([$prevNum, $num], {yPercent:50}, {yPercent:0, duration:this.speed, ease:'power2.out'}, `-=${this.speed}`)
        .fromTo($prevNum, {autoAlpha:0.5}, {autoAlpha:0, duration:this.speed, ease:'power2.out'},`-=${this.speed}`)
      
      if(index!==3) {
        let timelineEnd = gsap.timeline()
          .fromTo($index, {autoAlpha:1}, {autoAlpha:0, duration:this.speed, ease:'power2.inOut'})
          .fromTo([$num, $nextNum], {yPercent:0}, {yPercent:-50, duration:this.speed, ease:'power2.in'}, `-=${this.speed}`)
          .fromTo($nextNum, {autoAlpha:0}, {autoAlpha:0.5, duration:this.speed, ease:'power2.in'},`-=${this.speed}`)


        timeline.add(timelineEnd, '>')
      }
        

      this.animation.add(timeline, '>');
    })

    this.animation.play()
    setTimeout(()=>{
      this.animation.pause()
    },1000)

    let $range = this.$container.querySelector('input'),
        dur = this.animation.totalDuration();
    $range.setAttribute('min', speed);
    $range.setAttribute('max', dur);
    $range.addEventListener('input', ()=>{
      this.animation.seek($range.value);
      document.querySelector('.dur').textContent = `time: ${$range.value} s`;
    })

    this.setSize();
    window.addEventListener('resize', ()=>{this.setSize()});
  },
  setSize: function() {
    let h = $wrapper.getBoundingClientRect().height;
    this.$container.style.height = `${h}px`;
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

    document.addEventListener('mousemove',(event)=>{
      let x = event.clientX,
          y = event.clientY,
          moveSpeed,
          timeout;
      //move event
      moveSpeed = Math.sqrt((x-xStart)*(x-xStart)+(y-yStart)*(y-yStart));
      if(this.flag==true) {
        if(moveSpeed>5) {
          clearTimeout(timeout);
          this.$parent.classList.add('move');
          timeout = setTimeout(()=>{
            this.$parent.classList.remove('move');
          }, 250)
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
  },
  show: function() {
    gsap.to(this.$parent, {autoAlpha:1, duration:speed, ease:'power2.inOut'})
  }
}

const Distortion = {
  init: function() {
    document.addEventListener('lazybeforeunveil', function(event){
      let $image = event.target,
          $parent = $image.parentNode;

      if($parent.classList.contains('js-distortion')) {
        $image.style.display = 'none';
        let path = $image.getAttribute('data-src');

        //scene
        let camera, scene, renderer, material, plane,
            w = $parent.getBoundingClientRect().width,
            h = $parent.getBoundingClientRect().height,
            texture = new THREE.TextureLoader().load(path, ()=>{
              initScene();
            }),
            displacement = new THREE.TextureLoader().load('./img/displacement.jpg'),
            animationFrame;

        let initScene = ()=> {
          scene = new THREE.Scene();
          renderer = new THREE.WebGL1Renderer();
          renderer.setPixelRatio(window.devicePixelRatio);
          $parent.insertAdjacentElement('beforeend', renderer.domElement);
          camera = new PerspectiveCamera(
            70, 
            w/h,
            0.001,100
          )
          camera.position.set(0, 0, 1);
          material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            uniforms: {
              img: {type:'t', value:texture},
              displacement: {type:'t', value:displacement},
              progress: {type:'f', value:0.75}
            },
            vertexShader: vertex_distortion,
            fragmentShader: fragment_distortion
          })
          plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 64, 64), material);
          scene.add(plane);
          resize();
          window.addEventListener('resize', resize);
          render();

          gsap.timeline()
            .to(renderer.domElement, {autoAlpha:1, duration:speed*2, ease:'power2.inOut'})
            .to(material.uniforms.progress, {value:0, duration:speed*2, ease:'power2.out'}, `-=${speed*2}`)
            .eventCallback('onComplete', ()=>{
              $image.style.display = 'block';
              renderer.domElement.remove();
              scene.remove.apply(scene, scene.children);
              cancelAnimationFrame(animationFrame);
              window.removeEventListener('resize', resize);
            })
        }

        let render = ()=> {
          renderer.render(scene, camera);
          animationFrame = requestAnimationFrame(render);
        }

        let resize = ()=> {
          w = $parent.getBoundingClientRect().width;
          h = $parent.getBoundingClientRect().height;
          let fov;
          renderer.setSize(w,h);
          camera.aspect = w/h;
          plane.scale.x = (texture.image.width/texture.image.height);
          if(w/h > plane.scale.x) {
            fov = 2*(180/Math.PI)* (Math.atan((plane.scale.x/2)/(camera.position.z - plane.position.z)/camera.aspect));
          } else {
            fov = 2*(180/Math.PI)*Math.atan((plane.scale.y/2)/(camera.position.z - plane.position.z));
          }   
          camera.fov = fov; 
          camera.updateProjectionMatrix();
        }
      
      }
    });
  }
}

class BackgroundVideo {
  constructor($parent) {
    this.$parent = $parent;
  }
  init() {
    this.$video = this.$parent.querySelector('video');
    this.$video.volume = 1;
    this.$video.muted = true;
    this.resizeEvent = ()=> {
      this.resize();
    }
    this.checkPauseEvent = ()=> {
      this.checkPause();
    }
    this.endedEvent = ()=> {
      this.$video.currentTime = 0;
      this.$video.play();
      if(this.onEnd) {
        this.onEnd();
      }
    }
    this.pauseEvent = ()=> {
      if(this.onEnd) {
        this.onEnd();
      }
    }
    this.playEvent = ()=> {
      if(!this.initialized) {
        this.initialized = true;
        gsap.fromTo(this.$video, {autoAlpha:0}, {autoAlpha:1, duration:speed, ease:'power2.inOut'})
      }
    }

    this.resizeEvent();
    this.checkPauseEvent();
    window.addEventListener('resize', this.resizeEvent);
    PageScroll.addListener(this.checkPauseEvent)
    document.addEventListener("visibilitychange", this.checkPauseEvent);
    
    this.$video.addEventListener('play', this.playEvent)
    this.$video.addEventListener('pause', this.pauseEvent)
    this.$video.addEventListener('ended', this.endedEvent)
    
  }

  checkPause() {
    let position = this.$parent.getBoundingClientRect().y + this.$parent.getBoundingClientRect().height;
    if((position<=0 || document.visibilityState=='hidden') && this.flag) {
      this.flag = false;
      this.$video.pause();
    } else if(position>0 && document.visibilityState=='visible' && !this.flag) {
      this.flag = true;
      this.$video.play();
    }
  }

  resize() {
    let h = this.$parent.getBoundingClientRect().height,
        w = this.$parent.getBoundingClientRect().width,
        value = h/w,
        ratio = 0.5625;

    if(value<ratio) {
      this.$video.style.width = `${w}px`;
      this.$video.style.height = `${w*ratio}px`;
    } else {
      this.$video.style.height = `${h}px`;
      this.$video.style.width = `${h/ratio}px`;
    }
  }

  destroy() {
    this.$video.removeEventListener('play', this.playEvent);
    this.$video.removeEventListener('pause', this.pauseEvent)
    this.$video.removeEventListener('ended', this.endedEvent);
    window.removeEventListener('resize', this.resizeEvent);
    PageScroll.removeListener(this.checkPauseEvent)
    document.removeEventListener("visibilitychange", this.checkPauseEvent);
  }

}

const HomeScreenVideo = {
  init: function() {
    this.state = false;
    this.$scene = document.querySelector('.video-scene');
    this.$player = document.querySelector('.video-scene__player');
    this.$open = document.querySelector('.home-screen__play');
    this.$close = document.querySelector('.video-scene__close');
    this.$container = document.querySelector('.home-screen__container');
    this.$gradient = document.querySelector('.home-screen__gradient');
    this.controls = document.querySelector('.video-scene__controls');
    this.timeline = document.querySelector('.video-scene__timeline span');

    this.openAnimation = gsap.timeline({paused:true})
      .to([this.$container, this.$gradient], {autoAlpha:0, duration:speed, ease:'power2.inOut'})
      .to(this.controls, {autoAlpha:1, duration:speed/2, ease:'power2.inOut'})

    this.openEvent = ()=> {
      this.open();
    }
    this.closeEvent = ()=> {
      this.close();
    }
    
    this.$open.addEventListener('click', this.openEvent);
    this.$close.addEventListener('click', this.closeEvent);
    
    this.video = new BackgroundVideo(this.$scene);
    this.video.init()
    this.interval = setInterval(()=> {
      if(this.state) {
        let time = this.video.$video.duration,
        ctime = this.video.$video.currentTime;
        console.log(ctime/time*100)
        gsap.to(this.timeline, {css:{width:`${ctime/time*100}%`}, duration:0.1, ease:'linear'})
        if(time-ctime<2 && !this.volFlag) {
          this.volFlag = true;
          gsap.to(this.video.$video, {volume:0, duration:2, ease:'linear', onComplete:()=>{
            this.volFlag = false;
          }})
        }
      }
    }, 100)

    this.video.onEnd = ()=> {
      if(this.state) {
        this.close();
      }
    }

  },
  open: function() {
    this.state = true;
    this.openAnimation.play();
    gsap.timeline()
      .to(PageScroll, {scrollTop:0, duration:speed, ease:'power2.inOut'})
      .to(this.$player, {autoAlpha:0, duration:speed, ease:'power2.inOut'}, `-=${speed}`)
      .to(this.$player, {autoAlpha:1, duration:speed/2, ease:'power2.inOut'})
    setTimeout(()=>{
      this.video.$video.volume = 1;
      this.video.$video.muted = false;
      this.video.$video.currentTime = 0;
    }, speed*1000)
  
  },
  close: function() {
    this.state = false;
    gsap.to(this.video.$video, {volume:0, duration:2, ease:'power2.linear', onComplete:()=>{
      this.video.$video.muted = true;
    }})
    this.openAnimation.reverse();
  },
  destroy: function() {
    this.video.destroy();
    clearInterval(this.interval)
    this.$open.removeEventListener('click', this.openEvent);
    this.$close.removeEventListener('click', this.closeEvent);
  }
}
