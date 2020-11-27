//lazylaod
import 'lazysizes';
lazySizes.cfg.init = false;
lazySizes.cfg.expand = 100;
document.addEventListener('lazybeforeunveil', function(e){
  if(e.target.tagName!=='IMG') {
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
      Transitions.exit(data.current.container, data.current.namespace);
    },
    enter(data) {
      Transitions.enter(data.next.container, data.next.namespace);
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
import Inputmask from "inputmask";
const validate = require("validate.js");
import Splide from '@splidejs/splide';
import SwipeListener from 'swipe-listener';

const brakepoints = {
  sm: 576,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1600
}
const dev = false;
const speed = 1; //seconds
const autoslide_interval = 7; //seconds

const $wrapper = document.querySelector('.wrapper');
const $header = document.querySelector('.header');
const $body = document.body;

//scroll
const PageScroll = Scrollbar.init($wrapper, {
  damping: 0.2,
  thumbMinSize: 150
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
  App.init();
}

const App = {
  init: function() {
    this.$container = document.querySelector('[data-barba="container"]');
    this.namespace = this.$container.getAttribute('data-barba-namespace');
    this.name = this.$container.getAttribute('data-name');
    
    lazySizes.init();
    Cursor.init();
    TouchHoverEvents.init();
    Header.init();
    Nav.init();
    DistortionImages.init();
    Validation.init();
    Popup.init();
    Parralax.init();

    Preloader.finish(()=>{
      Transitions.enter(this.$container, this.namespace);
      if(!dev) {
        Cursor.show();
      }
    });
  }
}

const Transitions = {
  /* ENTER */
  enter: function($container, namespace) {
    App.$container = $container;
    App.namespace = namespace;
    App.name = App.$container.getAttribute('data-name');

    window.dispatchEvent(new Event("change"));
    window.$container = $container;
    PageScroll.track.yAxis.element.classList.remove('show');
    Nav.change(App.name);

    setTimeout(()=> {
      if(Pages[namespace]) {
        Pages[namespace].init();
      }

      Parralax.check();
      this.animation = gsap.to($container, {duration:speed*1.5 ,autoAlpha:1, ease:'power2.inOut'});
      this.animation.eventCallback('onComplete', ()=>{
        $wrapper.classList.remove('disabled');
      })
    }, speed*250)

  },
  /* EXIT */
  exit: function($container, namespace) {
    $wrapper.classList.add('disabled');
    $header.classList.remove('header_fixed');
    if(!dev) {
      Cursor.loading();
    }
    if(Nav.state) {
      Nav.close();
    }
    let y = Math.max(PageScroll.offset.y-window.innerHeight, 0);
    this.animation = gsap.timeline()
      .to($container, {duration:speed ,autoAlpha:0, ease:'power2.inOut'})
      .to(PageScroll, {scrollTop:y, duration:speed, ease:'power2.inOut'}, `-=${speed}`)
      .set(PageScroll, {scrollTop:0})

    this.animation.eventCallback('onComplete', ()=>{
      if(Pages[namespace]) {
        Pages[namespace].destroy();
      }
      Header.fixed = false;
      barba.done();
    })

  }
}

const Pages = {
  home: {
    init: function() {
      Splitting();
      WaveScene.init(()=>{
        Banner.init();
      });
      desktopConceptionsSlider.init();
    },
    destroy: function() {
      WaveScene.destroy();
      Banner.destroy();
      desktopConceptionsSlider.destroy();
    }
  },
  conception: {
    init: function() {
      HomeScreenVideo.init();
      this.slider = new CSlider(App.$container.querySelector('.conceptions-slider'));
      this.slider.init();
    },
    destroy: function() {
      HomeScreenVideo.destroy();
      this.slider.destroy();
    }
  },
  equipment: {
    init: function() {
      WaveScene.init();
    },
    destroy: function() {
      WaveScene.destroy();
    }
  },
  technology: {
    init: function() {
      WaveScene.init();
      //
      this.lines = [];
      let $items = document.querySelectorAll('.asm-connect-preview__item');
      $items.forEach(($this, index)=>{
        let $line = $this.querySelector('.asm-connect-preview__item-line span'),
            $value = $this.querySelector('.asm-connect-preview__item-idx'),
            value = +$this.getAttribute('data-value');
        this.lines[index] = new Scale($line, $value, value);
        this.lines[index].init();
      })
    },
    destroy: function() {
      WaveScene.destroy();
      for (let $line of this.lines) {
        $line.destroy();
      }
    }
  },
  portfolio: {
    init: function() {
      this.sliders = [];
      let $sliders = App.$container.querySelectorAll('.portfolio-section__slider .splide');
      $sliders.forEach(($slider, index)=>{
        this.sliders[index] = new PortfolioSlider($slider);
        this.sliders[index].init();
      })

    },
    destroy: function() {
      for (let slider of this.sliders) {
        slider.destroy();
      }
    }
  }
}

const Preloader = {
  min_loading_time: speed*2, 
  finish_speed: speed, 
  finish: function(callback) {
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
      gsap.to($wrapper, {autoAlpha:1, duration:this.finish_speed, ease:'power2.inOut'})
      $prelaoder.remove();
      if(callback) {
        callback();
      }
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
    this.$nav.style.top = `${PageScroll.offset.y}px`;
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
    this.$active_links = document.querySelectorAll(`[data-name='${namespace}']`);
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

    if( ((this.scrollY<y && this.scrollY>h && this.isVisible) || desktopConceptionsSlider.fixed) && !Nav.opened) {
      this.isVisible = false;
      this.animation.timeScale(2).play();
    } else if(this.scrollY>y && !this.isVisible && !desktopConceptionsSlider.fixed) {
      this.isVisible = true;
      this.animation.timeScale(1).reverse();
    }    

    this.scrollY = y;
  }
}

const Parralax = {
  init: function() {
    PageScroll.addListener(()=>{
      this.check();
    })
  },
  check: function() {
    let $items = App.$container.querySelectorAll('[data-parralax]');
    $items.forEach(($this, index)=>{
      let y = $this.getBoundingClientRect().y,
          h1 = window.innerHeight,
          h2 = $this.getBoundingClientRect().height,
          scroll = PageScroll.offset.y,
          factor = +$this.getAttribute('data-parralax');
  
      let val = ((scroll+h1/2)-(y+scroll+h2/2))*factor;
      gsap.set($this, {y:val})
    })
  }
}

const WaveScene = {
  init: function(callback) {
    this.$parent = App.$container.querySelector('.wave-scene');
    this.$scene = App.$container.querySelector('.wave-scene__container');
    this.images = this.$scene.getAttribute('data-images').split(', ');
    this.textures = [];
    this.index = 0;
    this.h = this.$scene.getBoundingClientRect().height;
    this.w = this.$scene.getBoundingClientRect().width;
    this.time = 0;
    this.minWave = 2;
    this.maxWave = 15;
    this.destination = {x:0, y:0};
    this.flag = false;

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
    this.checkVisible();
    this.checkVisibleEvent = ()=> {
      this.checkVisible();
    }
    PageScroll.addListener(this.checkVisibleEvent)
    document.addEventListener("visibilitychange", this.checkVisibleEvent);

    if(callback!==undefined) {
      callback();
    }
  },
  checkVisible: function() {
    let position = this.$parent.getBoundingClientRect().y + this.$parent.getBoundingClientRect().height;
    if((position<=0 || document.visibilityState=='hidden') && this.flag) {
      this.flag = false;
      cancelAnimationFrame(this.animationFrame);
    } else if(position>0 && document.visibilityState=='visible' && !this.flag) {
      this.flag = true;
      this.render();
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
    PageScroll.removeListener(this.checkVisibleEvent)
    document.removeEventListener("visibilitychange", this.checkVisibleEvent);
    cancelAnimationFrame(this.animationFrame);
    this.scene.remove.apply(this.scene, this.scene.children);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('mousemove', this.mousemove);
  }
}

const Banner = {
  init: function() {
    let $block = App.$container.querySelector('.home'),
        $titles = $block.querySelectorAll('.home-banner__slide-title'),
        $paginations = $block.querySelectorAll('.pagination__button');

    this.animations_enter = [];
    this.animations_exit = [];
    this.index = 0;

    $titles.forEach(($title, index)=>{
      let $chars = $title.querySelectorAll('.char');
      //
      this.animations_enter[index] = gsap.timeline({paused:true, onComplete:()=>{
        this.inAnimation = false;
      }})
        .set($title, {autoAlpha:1})
        .fromTo(WaveScene.$scene, {autoAlpha:0}, {autoAlpha:1, duration:speed, ease:'power1.inOut'}) 
        .fromTo(WaveScene.material.uniforms.waveLength, {value:WaveScene.maxWave}, {value:WaveScene.minWave, duration:speed, ease:'power1.out'}, `-=${speed}`)
        .fromTo($chars, {y:20}, {y:0, duration:speed*0.8, ease:'power2.out', stagger:{amount:speed*0.2}}, `-=${speed}`) 
        .fromTo($chars, {autoAlpha:0}, {autoAlpha:1, duration:speed*0.8, ease:'power2.inOut', stagger:{amount:speed*0.2}}, `-=${speed}`) 

      this.animations_exit[index] = gsap.timeline({paused:true, onStart:()=>{
        this.inAnimation = true;
      }})
        .fromTo(WaveScene.material.uniforms.waveLength, {value:WaveScene.minWave}, {immediateRender:false, value:WaveScene.maxWave, duration:speed, ease:'power1.out'})
        .fromTo(WaveScene.$scene, {autoAlpha:1}, {immediateRender:false, autoAlpha:0, duration:speed, ease:'power2.out'}, `-=${speed}`) 
        .to($chars, {y:-20, duration:speed*0.8, ease:'power1.in', stagger:{amount:speed*0.2}}, `-=${speed}`)
        .to($chars, {autoAlpha:0, duration:speed*0.8, ease:'power2.inOut', stagger:{amount:speed*0.2}}, `-=${speed}`)
        .set($title, {autoAlpha:0})

    })

    this.change = ()=> {
      if(!this.initialized) {
        this.initialized = true;
        this.animations_enter[this.index].play(0);
        this.interval = setInterval(this.autoslide, autoslide_interval*1000);
      } else {
        $paginations[this.old].classList.remove('active');
        this.animations_exit[this.old].play(0).eventCallback('onComplete', ()=>{
          WaveScene.material.uniforms.img.value = WaveScene.textures[this.index];
          this.animations_enter[this.index].play(0);
        })
      }
      $paginations[this.index].classList.add('active');
      this.old = this.index;
    }

    this.autoslide = ()=> {
      this.index++;
      if(this.index>$titles.length-1) {
        this.index=0;
      }
      this.change();
    }

    $paginations.forEach(($button, index)=>{
      $button.addEventListener('click', ()=>{
        if(!this.inAnimation) {
          clearInterval(this.interval);
          this.interval = setInterval(this.autoslide, autoslide_interval*1000);
          this.index = index;
          this.change();
        }
      })
    })
    
    this.change();

  },
  destroy: function() {
    this.initialized = false;
    this.inAnimation = false;
    clearInterval(this.interval);
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
    this.$element.setAttribute("style", `stroke-dasharray:${this.circumference};stroke-dashoffset:0;`);
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
  loading: function() {
    this.$parent.classList.add('loading');
    gsap.timeline()
      .fromTo(this.$parent, {rotation:0}, {rotation:420, duration:speed*0.9, ease:'power2.in'})
      .fromTo(this.$element, {css:{'stroke-dashoffset':0}}, {css:{'stroke-dashoffset':this.circumference*0.9}, duration:speed*0.9, ease:'power2.in'}, `-=${speed*0.9}`)
      .to(this.$parent, {autoAlpha:0, duration:speed*0.5, ease:'power2.in'}, `-=${speed*0.5}`)
      .set(this.$element, {css:{'stroke-dashoffset':this.circumference*0.75}})
      //end
      .to(this.$parent, {rotation:1080, duration:speed*1.5, ease:'power2.out'}, `+=${speed*0.25}`)
      .to(this.$parent, {autoAlpha:1, duration:speed*0.25, ease:'power2.out'}, `-=${speed*1.5}`)
      .to(this.$element, {css:{'stroke-dashoffset':0}, duration:speed, ease:'power2.inOut'}, `-=${speed}`)
      .set(this.$parent, {rotation:0})
      .eventCallback('onComplete', ()=>{
        this.$parent.classList.remove('loading');
      })
  },
  show: function() {
    gsap.to(this.$parent, {autoAlpha:1, duration:speed, ease:'power2.inOut'})
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
    this.$scene = App.$container.querySelector('.video-scene');
    this.$player = App.$container.querySelector('.video-scene__player');
    this.$open = App.$container.querySelector('.home-screen__play');
    this.$close = App.$container.querySelector('.video-scene__close');
    this.$container = App.$container.querySelector('.home-screen__container');
    this.$gradient = App.$container.querySelector('.home-screen__gradient');
    this.controls = App.$container.querySelector('.video-scene__controls');
    this.timeline = App.$container.querySelector('.video-scene__timeline span');

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

const Validation = {
  init: function() {
    //validation
    this.namspaces = {
      name: 'name',
      phone: 'phone'
    }
    this.constraints = {
      name: {
        presence: {
          allowEmpty: false,
          message: '^Введите ваше имя'
        },
        format: {
          pattern: /[A-zА-яЁё ]+/,
          message: '^Введите корректное имя'
        },
        length: {
          minimum: 2,
          tooShort: "^Имя слишком короткое (минимум %{count} символа)",
          maximum: 20,
          tooLong: "^Имя слишком длинное (максимум %{count} символов)"
        }
      },
      phone: {
        presence: {
          allowEmpty: false,
          message: '^Введите ваш номер телефона'
        },
        format: {
          pattern: /^\+7 \d{3}\ \d{3}\-\d{4}$/,
          message: '^Введите корректный номер телефона'
        }
      }
    };
    this.mask = Inputmask({
      mask: "+7 999 999-9999",
      showMaskOnHover: false,
      clearIncomplete: false
    }).mask('[name="phone"]');

    document.addEventListener('submit', (event)=>{
      event.preventDefault();
      let $form = event.target;
      if($form.classList.contains('js-validation') && this.checkValid($form)) {
        //submit
      }
    })
    document.addEventListener('input', (event)=>{
      let $input = event.target,
          $form = $input.closest('form');
      if($form && $form.classList.contains('js-validation')) {
        this.checkValid($form, $input);
      }
    })

  },
  checkValid: function($form, $input) {
    let $inputs = $form.querySelectorAll('input, textarea'),
        values = {},
        constraints = {},
        resault;

    $inputs.forEach(($input)=>{
      let name = $input.getAttribute('name');
      for(let key in this.namspaces) {
        if($input.getAttribute('data-validate')==this.namspaces[key]) {
          values[name] = $input.value;
          constraints[name] = this.constraints[key];
        }
      }
    })

    resault = validate(values, constraints);

    if(resault!==undefined) {
      if($input!==undefined) {
        let flag = true,
            name = $input.getAttribute('name');
        for(let key in resault) {
          if(name==key) {
            flag=false;
          }
        }
        if(flag && $input.parentNode.classList.contains('error')) {
          $input.parentNode.classList.remove('error');
          $input.parentNode.querySelector('.input__message').remove();
        }
      } 
      else {
        $inputs.forEach(($input)=>{
          let name = $input.getAttribute('name');
          for(let key in resault) {
            if(name==key) {
              if(!$input.parentNode.classList.contains('error')) {
                $input.parentNode.classList.add('error');
                $input.parentNode.insertAdjacentHTML('beforeend', `<span class="input__message">${resault[key][0]}</span>`);
                gsap.to($input.parentNode.querySelector('.input__message'), {autoAlpha:1, duration:0.25, ease:'power2.out'})
              } else {
                $input.parentNode.querySelector('.input__message').textContent = `${resault[key][0]}`;
              }
            }
          }
        })
      }
      return false;
    } else {
      $inputs.forEach(($input)=>{
        $input.parentNode.classList.remove('error');
        let $message = $input.parentNode.querySelector('.input__message');
        if($message) $message.remove();
      })
      return true;
    }
  },
  reset: function($form) {
    let $inputs = $form.querySelectorAll('input, textarea');
    $inputs.forEach(($input)=>{
      $input.value = '';
      if($input.parentNode.classList.contains('error')) {
        $input.parentNode.classList.remove('error');
        $input.parentNode.querySelector('.input__message').remove();
      }
    })
  }
}

const Popup = {
  init: function() {
    
    document.addEventListener('click', (event)=>{
      let $button = event.target!==document?event.target.closest('[data-popup]'):null;
      if($button && $button.getAttribute('data-popup')=='open') {
        event.preventDefault();
        let href = $button.getAttribute('href'), 
            $popup = document.querySelector(`${href}`);
        //popup is
        if($popup) {
          let $content = $popup.querySelector('.popup-block__container');
          this.newAnimation = gsap.timeline({paused:true})
            .fromTo($popup, {autoAlpha:0}, {autoAlpha:1, duration:speed/2, ease:'power2.inOut'})
            .fromTo($content, {y:20}, {y:0, duration:speed, ease:'power2.out'}, `-=${speed/2}`)
          
          if($popup.classList.contains('popup-succes')) {
            let $icon = $popup.querySelector('path'),
                w = $icon.getTotalLength();
            let timeline = gsap.timeline()
              .set($icon, {css:{'stroke-dasharray':w}})
              .fromTo($icon, {css:{'stroke-dashoffset':w}}, {duration:speed, css:{'stroke-dashoffset':0}, ease:'power2.out'})
            this.newAnimation.add(timeline, `-=${speed}`)
          }

          if(this.oldAnimation) {
            this.oldAnimation.timeScale(1.5).reverse().eventCallback('onReverseComplete', ()=>{
              this.newAnimation.play();
            });
          } else {
            this.newAnimation.play();
          }
          
          this.oldAnimation = this.newAnimation;
        }
      } 
      else if($button && $button.getAttribute('data-popup')=='close') {
        let $popup = $button.closest('.popup'),
            $form = $popup.querySelector('form');
        this.oldAnimation.timeScale(1.5).reverse();
        this.oldAnimation = false;
        if($form) Validation.reset($form);
      }
    })

  }
}

class Scale {
  constructor($line, $value, value) {
    this.$line = $line;
    this.$value = $value;
    this.value = value;
  }

  init() {
    this.flag = false;
    this.listener = ()=> {
      this.check();
    }
    PageScroll.addListener(this.listener);
    this.check();
  }
  check() {
    let sy = PageScroll.offset.y,
        ty = this.$line.getBoundingClientRect().y,
        h = window.innerHeight;

    if(sy+h > ty+sy && !this.flag) {
      this.flag = true;

      let i = {};
      i.value = 0;

      gsap.timeline()
        .to(this.$line, {css:{width:`${100+this.value}%`}, duration:speed*1.5, ease:'power2.out'})
        .to(i, {value:this.value, duration:speed*1.5, ease:'power2.out'}, `-=${speed*1.5}`)

      let iteration = ()=> {
        this.$value.textContent = `- ${Math.abs(Math.floor(i.value))}%`;
        this.animation = requestAnimationFrame(iteration);
      }
      iteration();

    }
  }
  destroy() {
    PageScroll.removeListener(this.listener);
  }
}

class DistortionScene {
  constructor($scene) {
    this.$scene = $scene;
  }

  init(callback) {
    this.time = 0;
    this.w = this.$scene.getBoundingClientRect().width,
    this.h = this.$scene.getBoundingClientRect().height;
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGL1Renderer({alpha: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.$scene.insertAdjacentElement('beforeend', this.renderer.domElement);
    gsap.set(this.renderer.domElement, {autoAlpha:0})
    this.camera = new PerspectiveCamera(
      70, 
      this.w/this.h,
      0.001, 100
    )
    this.camera.position.set(0, 0, 1);
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        time: {type:'f'},
        img1: {type:'t'},
        img2: {type:'t'},
        progress1: {type:'f'},
        progress2: {type:'f'},
        resolution: {type:'v2'},
      },
      vertexShader: vertex_distortion,
      fragmentShader: fragment_distortion
    })
    this.plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 64, 64), this.material);
    this.scene.add(this.plane);

    this.render = ()=> {
      let y = this.$scene.getBoundingClientRect().top,
          h = window.innerHeight,
          h2 = this.$scene.getBoundingClientRect().height,
          v1 = h-y, 
          v2 = h2+y,
          style = window.getComputedStyle(this.$scene, null);

      if(v1>0 && v2>0 && !this.visible) {
        this.visible = true;
        if(this.isvisible) this.isvisible();
      } 

      if(v1>0 && v2>0 && style.visibility=='visible' && style.display=='block') {
        this.time+=0.05;
        this.material.uniforms.time.value = this.time;
        this.renderer.render(this.scene, this.camera);
      } 
      this.animationFrame = requestAnimationFrame(this.render);
    }

    this.resize = (texture, s)=>{
      this.w = this.$scene.getBoundingClientRect().width;
      this.h = this.$scene.getBoundingClientRect().height;
      this.material.uniforms.resolution.value = new THREE.Vector2(this.w, this.h);
      this.renderer.setSize(this.w,this.h);
      this.camera.aspect = this.w/this.h;
      let fov;
      let scale = texture.image.width/texture.image.height;
      if(this.w/this.h > scale) {
        fov = 2*(180/Math.PI)* (Math.atan((scale/2)/(this.camera.position.z - this.plane.position.z)/this.camera.aspect));
      } else {
        fov = 2*(180/Math.PI)*Math.atan((this.plane.scale.y/2)/(this.camera.position.z - this.plane.position.z));
      }   
      gsap.timeline()
        .to(this.plane.scale, {x:scale, duration:s, ease:'power2.inOut'})
        .to(this.camera, {fov:fov, duration:s, ease:'power2.inOut'}, `-=${s}`)
      let updateFrame;
      let updateCamera = ()=> {
        this.camera.updateProjectionMatrix();
        updateFrame = requestAnimationFrame(updateCamera);
      }
      updateCamera();
      if(s==0) {
        cancelAnimationFrame(updateFrame);
      } else {
        setTimeout(()=>{
          cancelAnimationFrame(updateFrame);
        }, s*1000)
      }
    }
    this.resizeEvent = ()=> {
      this.resize(this.texture, 0);
    }
    this.checkVisibleEvent = ()=> {
      this.checkVisible();
    }
    if(this.initialized) this.initialized();
    if(callback) callback();
  }

  on(callback, func) {
    if(callback=='showed') {
      this.showed = func;
    } else if(callback=='changed') {
      this.changed = func;
    } else if(callback=='started') {
      this.started = func;
    } else if(callback=='initialized') {
      this.initialized = func;
    } else if(callback=='isvisible') {
      this.isvisible = func;
    }
  }

  start(texture) {
    this.textures = [];
    this.texture = this.textures[0] = new THREE.TextureLoader().load(texture, ()=>{
      window.addEventListener('resize', this.resizeEvent);
      this.resize(this.texture, 0);
      this.material.uniforms.img1.value = this.texture;
      this.material.uniforms.img2.value = this.texture;
      this.render();
      //callback
      if(this.started) this.started();
    })
  }

  show() {
    gsap.timeline()
      .fromTo([this.material.uniforms.progress1, this.material.uniforms.progress2], {value:1}, {value:0, duration:speed*1.5, ease:'power2.out'})
      .to(this.renderer.domElement, {autoAlpha:1, duration:speed*1.5, ease:'power2.inOut'}, `-=${speed*1.5}`)
      .eventCallback('onComplete', ()=>{
        if(this.showed) this.showed();
      })
  }

  change(texture, index) {

    let change = ()=> {
      this.texture = this.textures[index];
      this.material.uniforms.img2.value = this.texture;
      this.resize(this.texture, speed);
      gsap.timeline()
        .fromTo(this.material.uniforms.progress1, {value:0}, {value:1, duration:speed, ease:'power2.inOut'})
        .fromTo(this.material.uniforms.progress2, {value:1}, {value:0, duration:speed, ease:'power2.inOut'}, `-=${speed}`)
        .eventCallback('onComplete', ()=>{
          this.material.uniforms.progress1.value = 0;
          this.material.uniforms.progress2.value = 0;
          this.material.uniforms.img1.value = this.texture;
          if(this.changed) this.changed();
      })
    }

    if(this.textures[index] && this.textures[index].image) {
      change();
    } else {
      this.texture = this.textures[index] = new THREE.TextureLoader().load(texture, ()=>{
        change();
      })
    }
  }

  destroy() {
    this.scene.remove.apply(this.scene, this.scene.children);
    cancelAnimationFrame(this.animationFrame);
    this.renderer.domElement.remove();
    window.removeEventListener('resize', this.resizeEvent);
  }

}

const desktopConceptionsSlider = {
  init: function() {
    this.$slider = App.$container.querySelector('.conceptions__slider');
    this.$container = App.$container.querySelector('.conceptions__slider-container');
    this.$wrapper = App.$container.querySelector('.conceptions__slider-wrapper');
    this.$slides = App.$container.querySelectorAll('.conceptions-slide');
    this.$scale = App.$container.querySelector('.conceptions__scale span');
    this.slides = {};
    this.speed = 1;
    this.duration = this.speed*7;
    

    if(window.innerWidth>brakepoints.xl) {
      this.create_desktop_animation(()=>{
        this.checkScrolling();
        



        /* 
        let $range = this.$container.querySelector('input');
        $range.setAttribute('min', speed);
        $range.setAttribute('max', this.animation.totalDuration());
        $range.addEventListener('input', ()=>{
          this.animation.seek($range.value);
          App.$container.querySelector('.dur').textContent = `time: ${$range.value} s`;
        }) */
      });
    }
  },

  create_desktop_animation: function(callback) {
    this.animation = gsap.timeline({paused:true})

    this.$slides.forEach(($slide, slide_index)=>{
      this.slides[slide_index] = {};
      //create scenes
      this.slides[slide_index].scenes = [];
      $slide.querySelectorAll('.image').forEach(($scene, scene_index)=>{
        let $img = $scene.querySelector('img'),
            texture = $img.getAttribute('data-src');
            $img.style.display = 'none';
        let scene = this.slides[slide_index].scenes[scene_index] = new DistortionScene($scene);
        scene.on('initialized', ()=>{
          scene.start(texture);
        })
        scene.on('started', ()=>{
        })
        scene.init();
      });
      //create animations
      let $index = $slide.querySelector('.conceptions-slide__index'),
          $num = $slide.querySelector('.conceptions-slide__value-index-current'),
          $prevNum = $slide.querySelector('.conceptions-slide__value-index-prev'),
          $nextNum = $slide.querySelector('.conceptions-slide__value-index-next'),
          //
          $slogan = $slide.querySelector('.conceptions-slide__slogan'),
          $text = $slide.querySelector('.conceptions-slide__text'),
          //
          $dec = $slide.querySelector('.conceptions-slide__dec-val'),
          $decline = $slide.querySelector('.conceptions-slide__dec-line'),
          //
          $button = $slide.querySelector('.conceptions-slide__button'),
          //
          $chars = $slide.querySelectorAll('.conceptions-slide__title .char');
      //timeline start
      let timeline_start = gsap.timeline()
        .set($slide, {autoAlpha:1})
        .fromTo($index, {autoAlpha:0}, {autoAlpha:1, duration:this.speed, ease:'power2.inOut'})
        .fromTo($index, {x:100}, {x:0, duration:this.speed, ease:'power2.out'}, `-=${this.speed}`)
        .fromTo([$prevNum, $num], {yPercent:50}, {yPercent:0, duration:this.speed, ease:'power2.out'}, `-=${this.speed}`)
        .fromTo($prevNum, {autoAlpha:0.5}, {autoAlpha:0, duration:this.speed, ease:'power2.out'},`-=${this.speed}`)
        //slogan
        .fromTo($slogan, {autoAlpha:0, y:50}, {autoAlpha:1, y:0, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
        //text
        .fromTo($text, {autoAlpha:0, y:25}, {autoAlpha:1, y:0, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
        //dec
        .fromTo($dec, {autoAlpha:0, x:15}, {autoAlpha:1, x:0, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
        .fromTo($decline, {yPercent:50, scaleY:0}, {yPercent:0, scaleY:1, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
        //
        .fromTo($button, {autoAlpha:0}, {autoAlpha:1, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
        .fromTo($button, {x:25}, {x:0, duration:this.speed, ease:'power2.out'}, `-=${this.speed}`)
        //
        .fromTo($chars, {autoAlpha:0}, {autoAlpha:1, duration:this.speed*0.8, ease:'power2.inOut', stagger:{amount:this.speed*0.2}}, `-=${this.speed}`)
        .fromTo($chars, {y:20}, {y:0, duration:this.speed*0.8, ease:'power2.out', stagger:{amount:this.speed*0.2}}, `-=${this.speed}`)
      //timeline start images
      for(let index in this.slides[slide_index].scenes) {
        let scene = this.slides[slide_index].scenes[index];
        let timeline_image = gsap.timeline()
          .fromTo([scene.material.uniforms.progress1, scene.material.uniforms.progress2], {value:1}, {value:0, duration:this.speed, ease:'power2.out'})
          .fromTo(scene.renderer.domElement, {autoAlpha:0}, {autoAlpha:1, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
          .fromTo(scene.renderer.domElement, {scale:0.9}, {scale:1, duration:this.speed, ease:'power2.out'}, `-=${this.speed}`)
    
        timeline_start.add(timeline_image, `>-${this.speed}`)
        //fix1
        if(slide_index==0 && index==0) {
          let timeline_image = gsap.timeline()
            .fromTo(scene.renderer.domElement, {xPercent:-5}, {xPercent:0, duration:this.speed, ease:'power2.out'}, `-=${this.speed}`)
          timeline_start.add(timeline_image, `>-${this.speed}`)
        } else if(slide_index==2 && index==1) {
          let timeline_image = gsap.timeline()
            .fromTo(scene.renderer.domElement, {xPercent:5}, {xPercent:0, duration:this.speed, ease:'power2.out'}, `-=${this.speed}`)
          timeline_start.add(timeline_image, `>-${this.speed}`)
        }
      }
      //timeline end
      if(slide_index!==3) {
        let timeline_end = gsap.timeline()
          //index
          .fromTo($index, {autoAlpha:1}, {autoAlpha:0, duration:this.speed, ease:'power2.inOut'})
          .fromTo($index, {x:0}, {x:-100, duration:this.speed, ease:'power2.in'}, `-=${this.speed}`)
          .fromTo([$num, $nextNum], {yPercent:0}, {yPercent:-50, duration:this.speed, ease:'power2.in'}, `-=${this.speed}`)
          .fromTo($nextNum, {autoAlpha:0}, {autoAlpha:0.5, duration:this.speed, ease:'power2.in'},`-=${this.speed}`)
          //slogan
          .to($slogan, {autoAlpha:0, y:-50, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
          //text
          .to($text, {autoAlpha:0, y:-25, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
          //dec
          .to($dec, {autoAlpha:0, x:-15, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
          .to($decline, {yPercent:-50, scaleY:0, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
          //
          .to($button, {autoAlpha:0, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
          .to($button, {x:-25, duration:this.speed, ease:'power2.in'}, `-=${this.speed}`)
          //
          .to($chars, {autoAlpha:0, duration:this.speed*0.8, ease:'power2.inOut', stagger:{amount:this.speed*0.2}}, `-=${this.speed}`)
          .to($chars, {y:-20, duration:this.speed*0.8, ease:'power2.in', stagger:{amount:this.speed*0.2}}, `-=${this.speed}`)
          .set($slide, {autoAlpha:0})
        //timeline end images
        for(let index in this.slides[slide_index].scenes) {
          let scene = this.slides[slide_index].scenes[index];
          let timeline_image = gsap.timeline()
            .to([scene.material.uniforms.progress1, scene.material.uniforms.progress2], {value:1, duration:this.speed, ease:'power2.in'})
            .to(scene.renderer.domElement, {autoAlpha:0, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
            .to(scene.renderer.domElement, {scale:0.9, duration:this.speed, ease:'power2.in'}, `-=${this.speed}`)
          timeline_end.add(timeline_image, `>-${this.speed}`)
          
          if(slide_index==0 && index==0) {
            let timeline_image = gsap.timeline()
              .to(scene.renderer.domElement, {xPercent:-5, duration:this.speed, ease:'power2.in'}, `-=${this.speed}`)
            timeline_end.add(timeline_image, `>-${this.speed}`)
          } else if(slide_index==2 && index==1) {
            let timeline_image = gsap.timeline()
              .to(scene.renderer.domElement, {xPercent:5, duration:this.speed, ease:'power2.in'}, `-=${this.speed}`)
              timeline_end.add(timeline_image, `>-${this.speed}`)
          }
        }
        timeline_start.add(timeline_end, '>')
      }
      //add iteration to timeline
      this.animation.add(timeline_start, '>');
    })
    
    //final
    let finalanimations = gsap.timeline()
      .fromTo(this.$scale, {css:{width:'12.5%'}}, {css:{width:'100%'}, duration:this.duration, ease:'linear'})

    this.animation.add(finalanimations, `>-${this.duration}`);

    if(callback) callback();
  },

  checkScrolling: function() {
    this.scrollListener = ()=> {
      this.scrolling();
    }
    PageScroll.addListener(this.scrollListener);

    this.scrolling = ()=> {
      let y = PageScroll.offset.y,
          h = this.$slider.getBoundingClientRect().height,
          t = this.$slider.getBoundingClientRect().y,
          val = y-(t+y-h);
      
      if(val>=0 && val<=this.duration*h) {
        let time = (val/h);
        this.animation.seek(time);
      }

      if(val>=h && val<=this.duration*h) {
        this.fixed = true;
        let fix = val-h;
        gsap.set(this.$container, {y:fix})
      } else {
        this.fixed = false;
      }

    }

  },
  destroy: function() {
    if(this.scrollListener) {
      PageScroll.removeListener(this.scrollListener);
    }
    for(let slide_index in this.slides) {
      if(this.slides[slide_index].scenes) {
        for(let scene_index in this.slides[slide_index].scenes) {
          this.slides[slide_index].scenes[scene_index].destroy()
          console.log('destroyed')
        }
      }
    }
    
  }
}

class PortfolioSlider {
  constructor($slider) {
    this.$slider = $slider;
  }

  init() {
    this.autoplay_interval = 7000;
    this.index = 0;
    this.$scene = this.$slider.closest('.portfolio-section').querySelector('.portfolio-section__scene-container');
    this.$images = this.$slider.querySelectorAll('img');
    this.textures = [];
    this.$images.forEach(($image, index)=>{
      this.textures[index] = $image.getAttribute('data-src');
    })

    this.getPrev = (index)=> {
      let val = index==0?this.textures.length-1:index-1;
      return val;
    }

    this.scene = new DistortionScene(this.$scene);
    this.slider = new Splide(this.$slider, {
      type: 'loop',
      perPage: 6,
      arrows: true,
      pagination: false,
      easing: 'ease-in-out',
      speed: speed*1000,
      gap: 24,
      autoplay: false,
      start: this.index+1,
      perMove: 1,
      interval: this.autoplay_interval
    });
    this.interval = setInterval(()=>{
      if(!this.enabled) {
        this.slider.State.set(this.slider.STATES.MOVING);
      } else {
        this.slider.State.set(this.slider.STATES.IDLE);
      }
    }, 10)

    this.scene.on('initialized', ()=>{
      this.scene.start(this.textures[this.index]);
    })
    this.scene.on('isvisible', ()=>{
      this.scene.show();
    })
    this.scene.on('showed', ()=>{
      this.enabled = true;
    })
    this.scene.on('changed', ()=>{
      this.enabled = true;
    })
    
    this.slider.on('move', (newIndex)=>{
      this.index = this.getPrev(newIndex);
      this.scene.change(this.textures[this.index], this.index);
      this.enabled = false;
    });
    this.slider.on('click', ($slide)=>{
      this.slider.go($slide.index+1);
    });

    this.slider.mount();
    this.scene.init();
  }

  destroy() {
    this.scene.destroy();
    this.slider.destroy();
  }
}

class CSlider {
  constructor($slider) {
    this.$slider = $slider;
  }

  init() {
    this.index = 0;
    this.$scene = this.$slider.querySelector('.conceptions-slider__d-images-container');
    this.$images = this.$slider.querySelectorAll('img');
    this.textures = [];
    this.$images.forEach(($image, index)=>{
      this.textures[index] = $image.getAttribute('data-src');
    })

    this.scene = new DistortionScene(this.$scene);
    this.slider = new Splide(this.$slider.querySelector('.splide'), {
      type: 'loop',
      perPage: 1,
      arrows: false,
      pagination: true,
      easing: 'ease-in-out',
      speed: speed*1000,
      autoplay: true,
      perMove: 1,
      interval: 10000
    })
    this.interval = setInterval(()=>{
      if(!this.enabled) {
        this.slider.State.set(this.slider.STATES.MOVING);
      } else {
        this.slider.State.set(this.slider.STATES.IDLE);
      }
    }, 10)

    this.scene.on('initialized', ()=>{
      this.scene.start(this.textures[this.index]);
    })
    this.scene.on('isvisible', ()=>{
      this.scene.show();
    })
    this.scene.on('showed', ()=>{
      this.enabled = true;
    })
    this.scene.on('changed', ()=>{
      this.enabled = true;
    })
    
    this.slider.on('move', (newIndex)=>{
      this.enabled = false;
      this.index = newIndex;
      this.scene.change(this.textures[this.index], this.index);
    });

    this.slider.mount();
    this.scene.init();
  }

  destroy() {
    this.scene.destroy();
    this.slider.destroy();
  }

}

const DistortionImages = {
  init: function() {
    this.objects = {};

    this.check(App.$container);
    barba.hooks.enter((data) => {
      this.check(data.next.container);
    });

    barba.hooks.leave(() => {
      for(let index in this.objects) {
        document.removeEventListener('lazybeforeunveil', this.objects[index].finded);
        this.objects[index].scene.destroy();
        delete this.objects[index];
      }
    });
    
  },
  check: function($page) {
    $page.querySelectorAll('.js-distortion').forEach(($scene, index)=>{
      let $img = $scene.querySelector('img'), 
          texture = $img.getAttribute('data-src');
  
      let obj = this.objects[index] = {};
      let scene = obj.scene = new DistortionScene($scene);
      scene.on('initialized', ()=>{
        $img.style.display='block';
        document.addEventListener('lazybeforeunveil', obj.finded);
      })
      scene.on('started', ()=>{
        scene.show();
      })
      scene.on('showed', ()=>{
        document.removeEventListener('lazybeforeunveil', obj.finded);
        $img.style.display = 'block';
        scene.destroy();
        delete this.objects[index];
      })
      obj.finded = (event)=> {
        if(event.target==$img) {
          $img.style.display='none';
          scene.start(texture);
        }
      }
      scene.init();
    })
  }
}