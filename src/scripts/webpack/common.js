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
const dev = true;
const speed = 1; //seconds
const autoslide_interval = 7; //seconds

const $wrapper = document.querySelector('.wrapper');
const $header = document.querySelector('.header');
const $body = document.body;

//bg
const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-bg');
const bg_dark = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-darker');

//check device
function mobile() {
  if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    return true;
  } else {
    return false;
  }
}


//scroll
const PageScroll = Scrollbar.init($wrapper, {
  damping: 0.1,
  thumbMinSize: 150
});
PageScroll.addListener(()=>{
  localStorage.setItem('scroll', PageScroll.offset.y);
})
if(+localStorage.getItem('scroll')>0 && dev) {
  PageScroll.setPosition(0, +localStorage.getItem('scroll'));
}
//scroll btn
document.addEventListener('click', (event)=>{
  let $btn = event.target!==document?event.target.closest('[data-scroll]'):null;
  if($btn) {
    let target = $btn.getAttribute('data-scroll'),
        y;
    if(target=='bottom') {
      let $parent = $btn.closest('.section');
      y = $parent.getBoundingClientRect().top + $parent.getBoundingClientRect().height + PageScroll.offset.y;
    } else {
      let $target = document.querySelector(target);
      y = $target.getBoundingClientRect().top + PageScroll.offset.y;
    }
    gsap.to(PageScroll, {scrollTop:y, duration:speed*1.5, ease:'power2.inOut'})
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
    if(!mobile()) {
      Cursor.init();
    }
    TouchHoverEvents.init();
    Header.init();
    Nav.init();
    DistortionImages.init();
    Validation.init();
    Popup.init();
    Parralax.init();
    SetSize.init();

    Preloader.finish(()=>{
      Transitions.active = true;
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

    SetSize.check();

    setTimeout(()=> {
      if(Pages[namespace]) {
        Pages[namespace].init();
      }
      Parralax.check();
      this.animation = gsap.to($container, {duration:speed*1.5 ,autoAlpha:1, ease:'power2.inOut'});
      this.animation.eventCallback('onComplete', ()=>{
        $wrapper.classList.remove('disabled');
        this.active = false;
      })
    }, speed*250)

  },
  /* EXIT */
  exit: function($container, namespace) {
    this.active = true;
    $wrapper.classList.add('disabled');
    $header.classList.remove('header_fixed');
    if(!mobile() && !dev) {
      Cursor.loading();
    }
    if(Nav.state) {
      Nav.close();
    }
    let y = Math.max(PageScroll.offset.y-window.innerHeight/2, 0);
    this.animation = gsap.timeline()
      .to($container, {duration:speed ,autoAlpha:0, ease:'power2.inOut'})
      .to(PageScroll, {scrollTop:y, duration:speed, ease:'power2.inOut'}, `-=${speed}`)
      .to($body, {css:{backgroundColor:bg}, duration:speed, ease:'none'}, `-=${speed}`)

    this.animation.eventCallback('onComplete', ()=>{
      if(Pages[namespace]) {
        Pages[namespace].destroy();
      }
      Header.fixed = false;
      PageScroll.scrollTop = 0;
      barba.done();
    })

  }
}

const Pages = {
  home: {
    init: function() {
      Splitting();
      HomeBanner.init();
      if(window.innerWidth>=brakepoints.lg) {
        desktopConceptionsSlider.init();
      }
      //slider
      this.tslider = new TechnologiesSlider(App.$container.querySelector('.technologies-slider'));
      this.tslider.init();
    },
    destroy: function() {
      HomeBanner.destroy();
      desktopConceptionsSlider.destroy();
      //slider
      this.tslider.destroy();
      delete this.tslider;
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
      //scene
      this.scene = new BackgroundScene(App.$container.querySelector('.home-screen__scene'))
      this.scene.init();
    },
    destroy: function() {
      //scene
      this.scene.destroy();
      delete this.scene;
    }
  },
  technology: {
    init: function() {
      //scene
      this.scene = new BackgroundScene(App.$container.querySelector('.home-screen__scene'))
      this.scene.init();
      //scales
      this.scales = {
        init: function() {
          this.lines = [];
          let $items = App.$container.querySelectorAll('.asm-connect-preview__item');
          $items.forEach(($this, index)=>{
            let $line = $this.querySelector('.asm-connect-preview__item-line span'),
                $value = $this.querySelector('.asm-connect-preview__item-idx'),
                value = +$this.getAttribute('data-value');
            this.lines[index] = new Scale($line, $value, value);
            this.lines[index].init();
          })
        },
        destroy: function() {
          for (let $line of this.lines) {
            $line.destroy();
          }
        }
      }
      this.scales.init();
    },
    destroy: function() {
      //scene
      this.scene.destroy();
      delete this.scene;
      //scales
      this.scales.destroy();
      delete this.scales;
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
      .set([$prelaoder, /* $images, */ $chars, $square], {css:{transition:'none'}})
      //.set($square, {autoAlpha:1}) 
      //.to($images, {autoAlpha:0, duration:this.finish_speed, ease:'power2.inOut'})
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
    if(window.innerWidth>brakepoints.md) {
      let w = window.innerWidth,
          cw = document.querySelector('.container').getBoundingClientRect().width,
          w2 = (w-cw)/2,
          nw = this.$container.querySelector('.nav__block').getBoundingClientRect().width;
      
      this.$container.style.width = `${nw+w2}px`;
    } 
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

    if(((this.scrollY<y && this.scrollY>h) || desktopConceptionsSlider.fixed) && !Transitions.active && this.isVisible && !Nav.opened) {
      this.isVisible = false;
      this.animation.timeScale(2).play();
    } else if((Transitions.active && !this.isVisible) || ((this.scrollY>y && !desktopConceptionsSlider.fixed && !this.isVisible))) {
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
          factor = +$this.getAttribute('data-parralax'),
          val;
      if($this.getAttribute('data-parralax-top')==null) {
        val = ((scroll+h1/2) - (y+scroll+h2/2)) * factor;
      } else {
        val = scroll * factor;
      }
      gsap.set($this, {y:val})
    })
  }
}

const HomeBanner = {
  init: function() {
    this.$parent = App.$container.querySelector('.home'),
    this.$titles = this.$parent.querySelectorAll('.home-banner__slide-title'),
    this.$paginations = this.$parent.querySelectorAll('.pagination__button');
    this.$scene = this.$parent.querySelector('.home-banner__scene');
    this.$images_container = this.$parent.querySelector('.home-banner__images');
    this.$images = this.$images_container.querySelectorAll('.image');
    this.index = 0;
    this.started = false;

    //visibility
    this.checkVisibilityEvent = ()=> {
      let h = this.$parent.getBoundingClientRect().height,
          y = this.$parent.getBoundingClientRect().top,
          v1 = window.innerHeight-y, 
          v2 = h+y;
      if(v1>0 && v2>0 && document.visibilityState=='visible' && !this.visibility) {
        this.visibility = true;
      } else if((v1<0 || v2<0 || document.visibilityState=='hidden') && this.visibility) {
        this.visibility = false;
      }
    }
    this.checkVisibilityEvent();
    this.checkVisibleInterval = setInterval(()=>{
      this.checkVisibilityEvent();
    }, 100)
    //DESKTOP
    if(window.innerWidth >= brakepoints.lg) {
      this.$images_container.style.display='none';
      this.textures = [];
      this.$images.forEach(($image, index)=>{
        this.textures[index] = $image.querySelector('img').getAttribute('data-src');
      })
      this.scene = new WaveScene(this.$scene);
      this.scene.on('visible', ()=>{
        if(!this.started) {
          this.started=true;
          this.scene.start(this.textures[this.index], this.index);
        }
      })
      this.scene.on('started', ()=>{
        this.start();
      })
      this.scene.init();
    }
    //MOBILE
    else {
      this.$scene.style.display='none';
      this.start();
    }
    
  },
  start: function() {
    //animations
    this.animations_enter = [];
    this.animations_exit = [];

    this.$titles.forEach(($title, index)=>{
      let $chars = $title.querySelectorAll('.char');
      this.animations_enter[index] = gsap.timeline({paused:true, onComplete:()=>{this.inAnimation=false;}})
        .set($title, {autoAlpha:1})
        .fromTo($chars, {y:20}, {y:0, duration:speed*0.8, ease:'power2.out', stagger:{amount:speed*0.2}}) 
        .fromTo($chars, {autoAlpha:0}, {autoAlpha:1, duration:speed*0.8, ease:'power2.inOut', stagger:{amount:speed*0.2}}, `-=${speed}`) 
      this.animations_exit[index] = gsap.timeline({paused:true, onStart:()=>{this.inAnimation=true;}})
        .to($chars, {y:-20, duration:speed*0.8, ease:'power1.in', stagger:{amount:speed*0.2}})
        .to($chars, {autoAlpha:0, duration:speed*0.8, ease:'power2.inOut', stagger:{amount:speed*0.2}}, `-=${speed}`)
        .set($title, {autoAlpha:0})
      //MOBILE
      if(window.innerWidth < brakepoints.lg) {
        let $image = this.$images[index];
        gsap.set($image, {autoAlpha:0});
        let image_in = gsap.timeline()
          .fromTo($image, {scale:1}, {scale:1.2, duration:speed, ease:'power2.in'})
          .fromTo($image, {autoAlpha:1}, {autoAlpha:0, duration:speed, ease:'power2.inOut'}, `-=${speed}`)
        let image_out = gsap.timeline()
          .fromTo($image, {scale:1.2}, {scale:1, duration:speed, ease:'power2.out'})
          .fromTo($image, {autoAlpha:0}, {autoAlpha:1, duration:speed, ease:'power2.inOut'}, `-=${speed}`)
        this.animations_enter[index].add(image_out, `>-${speed}`)
        this.animations_exit[index].add(image_in, `>-${speed}`)
      }
    })

    this.getNext = ()=> {
      let val = this.index==this.$titles.length-1?0:this.index+1;
      return val;
    }

    this.getPrev = ()=> {
      let val = this.index==0?this.$titles.length-1:this.index-1;
      return val;
    }

    this.change = (index)=> {
      if(!this.initialized || (this.visibility && !this.inAnimation)) {
        this.index = index;
        if(!this.initialized) {
          this.initialized = true;
          this.animations_enter[this.index].play(0);
          if(this.scene) this.scene.show(speed);
          this.interval = setInterval(this.autoslide, autoslide_interval*1000);
        } else {
          this.$paginations[this.old].classList.remove('active');
          if(this.scene) this.scene.change(this.textures[this.index], this.index, speed*2);
          this.animations_exit[this.old].play(0).eventCallback('onComplete', ()=>{
            this.animations_enter[this.index].play(0);
          })
        }
        this.$paginations[this.index].classList.add('active');
        this.old = this.index;
      }
      //autoslide
      if(this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(()=>{
        this.change(this.getNext());
      }, autoslide_interval*1000);
    }

    //click
    this.$paginations.forEach(($button, index)=>{
      $button.addEventListener('click', ()=>{
        this.change(index);
      })
    })
    //swipe
    this.swipes = SwipeListener(this.$parent);
    this.$parent.addEventListener('swipe', (event)=> {
      let dir = event.detail.directions;
      if(dir.left) this.change(this.getNext())
      else this.change(this.getPrev());
    });
    //start
    this.change(this.index);
  },
  destroy: function() {
    clearInterval(this.checkVisibleInterval);
    clearTimeout(this.timeout);
    this.scene.destroy();
    for(let child in this) {
      if(child!=='init' && child!=='start' && child!=='destroy') {
        delete this[child];
      }
    }
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

class BackgroundScene {
  constructor($scene) {
    this.$scene = $scene;
  }
  init() {
    this.scene = new WaveScene(this.$scene);
    this.scene.on('visible', ()=>{
      if(!this.flag) {
        this.flag = true;
        this.scene.start(this.$scene.getAttribute('data-src'));
        this.scene.renderer.domElement.setAttribute('data-parralax', '0.35');
      }
    })
    this.scene.on('started', ()=>{
      this.scene.show(speed);
    })
    this.scene.init();
  }
  destroy() {
    this.scene.destroy();
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
        gsap.to(this.timeline, {css:{width:`${ctime/time*100}%`}, duration:0.1, ease:'none'})
        if(time-ctime<2 && !this.volFlag) {
          this.volFlag = true;
          gsap.to(this.video.$video, {volume:0, duration:2, ease:'none', onComplete:()=>{
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
    gsap.to(this.video.$video, {volume:0, duration:2, ease:'power2.none', onComplete:()=>{
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

const desktopConceptionsSlider = {
  init: function() {
    this.$parent = App.$container.querySelector('.conceptions');
    this.$slider = this.$parent.querySelector('.conceptions__slider');
    this.$container = this.$parent.querySelector('.conceptions__slider-container');
    this.$wrapper = this.$parent.querySelector('.conceptions__slider-wrapper');
    this.$slides = this.$parent.querySelectorAll('.conceptions-slide');
    this.$scale = this.$parent.querySelector('.conceptions__scale span');
    this.slides = {};
    this.speed = 1;
    this.duration = this.speed*7;
    
    this.colorAnimation = gsap.timeline({paused:true})
        .fromTo($body, {css:{backgroundColor:bg}}, {css:{backgroundColor:bg_dark}, duration:this.speed, ease:'none'})

    this.create_desktop_animation(()=>{
      this.sizing(()=>{
        this.checkScrolling();
      });
    });

    this.sizingEvent = ()=> {
      this.sizing();
    }
    window.addEventListener('resize', this.sizingEvent);
  },

  sizing: function(callback) {
    this.h = this.$slider.getBoundingClientRect().height;
    this.factor = 1/(this.h/2); // seconds/scroll
    this.max_scroll = this.h+6/this.factor;
    this.$parent.style.paddingBottom = `${this.max_scroll-this.h}px`;
    if(callback) callback();
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
          $slogan = $slide.querySelector('.conceptions-slide__slogan'),
          $text = $slide.querySelector('.conceptions-slide__text'),
          $dec = $slide.querySelector('.conceptions-slide__dec-val'),
          $decline = $slide.querySelector('.conceptions-slide__dec-line'),
          $button = $slide.querySelector('.conceptions-slide__button'),
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
      .fromTo(this.$scale, {css:{width:'12.5%'}}, {css:{width:'100%'}, duration:this.duration, ease:'none'})

    this.animation.add(finalanimations, `>-${this.duration}`);

    if(callback) callback();
  },

  checkScrolling: function() {
    this.scrolling = (event)=> {
      let y = PageScroll.offset.y,
          t = this.$slider.getBoundingClientRect().y,
          scroll = y-(t+y-this.h);
          
      if(scroll>=0 && scroll<=this.max_scroll) {
        if(scroll>=this.h) {
          this.animation.seek(1+(scroll-this.h)*this.factor);
          this.fixed = true;
          gsap.set(this.$container, {y:scroll-this.h})
          if(this.autoscroll_timeout) clearTimeout(this.autoscroll_timeout);
          this.autoscroll_timeout = setTimeout(()=>{
            let points = [1, 3, 5, 7], value;
            for(let index in points) {
              if(Math.abs(points[index] - this.animation.time())<1) {
                value = (y-scroll) + this.h + (points[index]-1)/this.factor;
              }
            }
            this.autoscroll = gsap.to(PageScroll, {scrollTop:value, duration:speed, ease:'power1.inOut', onComplete:()=>{
              clearTimeout(this.autoscroll_timeout);
            }})
          }, 100)
        } else {
          this.animation.seek(scroll/this.h);
          if(this.fixed) {
            this.fixed = false;
            gsap.set(this.$container, {y:0})
            if(this.autoscroll_timeout) clearTimeout(this.autoscroll_timeout);
          }
        }
      } 

      else if(scroll>this.max_scroll && this.animation.progress()!==1) {
        this.fixed = false;
        this.animation.seek(7);
        gsap.set(this.$container, {y:this.max_scroll-this.h})
        if(this.autoscroll_timeout) clearTimeout(this.autoscroll_timeout);
      } 
      
      else if(scroll<0 && this.animation.progress()!==0) {
        this.animation.seek(0);
      }

      if(scroll>this.h/2 && scroll<=this.h && !Transitions.active) {
        let time = (scroll/this.h*2)-1;
        this.colorAnimation.seek(time);
      } else if(scroll>this.max_scroll && scroll<=this.max_scroll+this.h/2 && !Transitions.active) {
        let time = 1-(scroll-this.max_scroll)/this.h*2;
        console.log(time)
        this.colorAnimation.seek(time);
      }
    }

    this.mouseWheelListener = ()=> {
      if(this.autoscroll) {
        this.autoscroll.pause();
        this.autoscroll = false;
      }
    }

    this.scrolling();
    this.scrollListener = (event)=> {
      this.scrolling(event);
    }
    PageScroll.addListener(this.scrollListener);
    this.$slider.addEventListener('wheel', this.mouseWheelListener)
  },
  destroy: function() {
    window.removeEventListener('resize', this.sizing)
    if(this.autoscroll_timeout) {
      clearTimeout(this.autoscroll_timeout);
    }
    this.$slider.removeEventListener('wheel', this.mouseWheelListener)
    if(this.scrollListener) {
      PageScroll.removeListener(this.scrollListener);
      this.fixed = false;
    }
    for(let slide_index in this.slides) {
      if(this.slides[slide_index].scenes) {
        for(let scene_index in this.slides[slide_index].scenes) {
          this.slides[slide_index].scenes[scene_index].destroy();
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
      interval: 1000*autoslide_interval
    });
    this.interval = setInterval(()=>{
      if(!this.enabled) {
        this.slider.State.set(this.slider.STATES.MOVING);
      } else {
        this.slider.State.set(this.slider.STATES.IDLE);
      }
    }, 10)

    this.scene.on('visible', ()=>{
      if(!this.initialized) {
        this.initialized = true;
        this.scene.start(this.textures[this.index]);
      }
    })
    this.scene.on('started', ()=>{
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
    clearInterval(this.interval);
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
      interval: 1000*autoslide_interval
    })
    this.interval = setInterval(()=>{
      if(!this.enabled) {
        this.slider.State.set(this.slider.STATES.MOVING);
      } else {
        this.slider.State.set(this.slider.STATES.IDLE);
      }
    }, 10)

    this.scene.on('visible', ()=>{
      if(!this.initialized) {
        this.initialized = true;
        this.scene.start(this.textures[this.index]);
      }
    })
    this.scene.on('started', ()=>{
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
    clearInterval(this.interval);
  }

}

class TechnologiesSlider {
  constructor($parent) {
    this.$parent = $parent;
  }

  init() {
    this.index = 0;
    this.$slider = this.$parent.querySelector('.technologies-slider__slider');
    this.$images = this.$parent.querySelectorAll('.technologies-slider__image');
    this.$idx = this.$parent.querySelectorAll('.technologies-slider__idx span');

    //desktop
    if(window.innerWidth >= brakepoints.lg) {
      this.$scene = this.$parent.querySelector('.technologies-slider__scene');
      this.textures = [];
      this.$images.forEach(($image, index)=>{
        this.textures[index] = $image.querySelector('img').getAttribute('data-src');
        $image.style.display = 'none';
      })
      this.scene = new WaveScene(this.$scene);
      this.interval = setInterval(()=>{
        if(!this.enabled) {
          this.slider.State.set(this.slider.STATES.MOVING);
        } else {
          this.slider.State.set(this.slider.STATES.IDLE);
        }
      }, 10)
      this.scene.on('visible', ()=>{
        if(!this.initialized) {
          this.initialized = true;
          this.scene.start(this.textures[this.index]);
        }
      })
      this.scene.on('started', ()=>{
        this.scene.show(speed);
        gsap.to(this.$idx[this.index], {autoAlpha:1, duration:speed, ease:'power2.inOut'})
      })
      this.scene.on('showed', ()=>{
        this.enabled = true;
      })
      this.scene.init();
    }
    //mobile 
    else {
      this.animations = [];
      this.$images.forEach(($image, index)=>{
        this.animations[index] = gsap.timeline({paused:true})
          .fromTo($image, {scale:1.2}, {scale:1, duration:speed, ease:'power2.out'})
          .fromTo($image, {autoAlpha:0}, {autoAlpha:1, duration:speed, ease:'power2.inOut'}, `-=${speed}`)
      })
      this.animations[this.index].play();
    }

    this.slider = new Splide(this.$slider, {
      type: 'loop',
      perPage: 1,
      arrows: false,
      pagination: true,
      easing: 'ease-in-out',
      speed: speed*1000,
      autoplay: true,
      perMove: 1,
      interval: 1000*autoslide_interval
    })
    
    this.slider.on('move', (newIndex)=>{
      gsap.to(this.$idx[this.index], {autoAlpha:0, duration:speed, ease:'power2.inOut'})
      gsap.to(this.$idx[newIndex], {autoAlpha:1, duration:speed, ease:'power2.inOut'})
      this.enabled = false;
      //desktop
      if(this.scene) {
        this.scene.change(this.textures[newIndex], newIndex, speed*2);
      } 
      //mobile 
      else {
        this.animations[this.index].reverse();
        this.animations[newIndex].play();
      }
      this.index = newIndex;
    });

    this.slider.mount();
  }

  destroy() {
    if(this.scene) this.scene.destroy();
    if(this.interval) clearInterval(this.interval);
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

const SetSize = {
  init: function() {
    window.addEventListener('resize', ()=>{
      this.check();
    })
  }, 
  check: function() {
    let $elements = document.querySelectorAll('[data-window]'),
        h = $wrapper.getBoundingClientRect().height;
    $elements.forEach(($element)=>{
      $element.style.height = `${h}px`;
    })
  }
}



//scenes
class ResourceTracker {
  constructor() {
    this.resources = new Set();
  }
  track(resource) {
    if (resource.dispose) {
      this.resources.add(resource);
    }
    return resource;
  }
  untrack(resource) {
    this.resources.delete(resource);
  }
  dispose() {
    for (const resource of this.resources) {
      resource.dispose();
    }
    this.resources.clear();
  }
}
class DistortionScene {
  constructor($scene) {
    this.$scene = $scene;
  }

  init() {
    this.resTracker = new ResourceTracker();
    this.track = this.resTracker.track.bind(this.resTracker);

    this.w = this.$scene.getBoundingClientRect().width;
    this.h = this.$scene.getBoundingClientRect().height;
    this.time = 0;
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
    this.material = this.track(new THREE.ShaderMaterial({
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
    }))
    this.plane = new THREE.Mesh(this.track(new THREE.PlaneGeometry(1, 1, 64, 64)), this.material);
    this.scene.add(this.plane);

    this.resizeEvent = ()=> {
      this.resize(this.texture);
    }
    this.checkVisibilityEvent = ()=> {
      let h = this.$scene.getBoundingClientRect().height,
          y = this.$scene.getBoundingClientRect().top,
          v1 = window.innerHeight-y, 
          v2 = h+y;
      if(v1>0 && v2>0 && document.visibilityState=='visible' && !this.visibility) {
        this.visibility = true;
        //callback
        if(this.visible_callback) this.visible_callback();
      } else if((v1<0 || v2<0 || document.visibilityState=='hidden') && this.visibility) {
        this.visibility = false;
        //callback
        if(this.hidden_callback) this.hidden_callback();
      }
    }
    this.checkVisibilityEvent();
    this.checkVisibleInterval = setInterval(()=>{
      this.checkVisibilityEvent();
    }, 50)
    //callback
    if(this.initialized_callback) this.initialized_callback();
  }

  resize(texture, speed) {
    this.w = this.$scene.getBoundingClientRect().width;
    this.h = this.$scene.getBoundingClientRect().height;
    this.material.uniforms.resolution.value = new THREE.Vector2(this.w, this.h);
    this.renderer.setSize(this.w,this.h);
    this.camera.aspect = this.w/this.h;
    let scale = texture.image.width/texture.image.height, 
        fov;
    if(this.w/this.h > scale) {
      fov = 2*(180/Math.PI)* (Math.atan((scale/2)/(this.camera.position.z - this.plane.position.z)/this.camera.aspect));
    } else {
      fov = 2*(180/Math.PI)*Math.atan((this.plane.scale.y/2)/(this.camera.position.z - this.plane.position.z));
    }
    if(speed) {
      this.updateCamera = ()=> {
        this.camera.updateProjectionMatrix();
        this.updateCameraFrame = requestAnimationFrame(this.updateCamera);
      }
      this.updateCamera();
      gsap.timeline()
        .to(this.plane.scale, {x:scale, duration:speed, ease:'power2.inOut'})
        .to(this.camera, {fov:fov, duration:speed, ease:'power2.inOut'}, `-=${speed}`)
        .eventCallback('onComplete', ()=>{
          cancelAnimationFrame(this.updateCameraFrame);
        })
    } 
    else {
      this.plane.scale.x = scale;
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }

  render() {
    let style = window.getComputedStyle(this.renderer.domElement, null);
    if(this.visibility && style.visibility=='visible') {
      this.time+=0.04;
      this.material.uniforms.time.value = this.time;
      this.renderer.render(this.scene, this.camera);
    } 
    this.animationFrame = requestAnimationFrame(()=>{this.render()});
  }

  start(texture) {
    this.textures = [];
    this.texture = this.textures[0] = this.track(new THREE.TextureLoader().load(texture, ()=>{
      this.material.uniforms.img1.value = this.texture;
      this.material.uniforms.img2.value = this.texture;
      this.resize(this.texture);
      this.render();
      window.addEventListener('resize', this.resizeEvent);
      //callback
      if(this.started_callback) this.started_callback();
    }))
  }

  show() {
    gsap.timeline()
      .fromTo([this.material.uniforms.progress1, this.material.uniforms.progress2], {value:1}, {value:0, duration:speed*1.5, ease:'power2.out'})
      .to(this.renderer.domElement, {autoAlpha:1, duration:speed*1.5, ease:'power2.inOut'}, `-=${speed*1.5}`)
      .eventCallback('onComplete', ()=>{
        if(this.showed_callback) this.showed_callback();
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
          if(this.changed_callback) this.changed_callback();
      })
    }

    if(this.textures[index] && this.textures[index].image) {
      change();
    } else {
      this.texture = this.textures[index] = this.track(new THREE.TextureLoader().load(texture, ()=>{
        change();
      }))
    }
  }

  on(callback, func) {
    if(callback=='initialized') {
      this.initialized_callback = func;
    } else if(callback=='visible') {
      this.visible_callback = func;
    } else if(callback=='hidden') {
      this.hidden_callback = func;
    } else if(callback=='started') {
      this.started_callback = func;
    } else if(callback=='showed') {
      this.showed_callback = func;
    } else if(callback=='changed') {
      this.changed_callback = func;
    }
  }

  destroy() {
    cancelAnimationFrame(this.updateCameraFrame);
    cancelAnimationFrame(this.animationFrame);
    clearInterval(this.checkVisibleInterval);
    window.removeEventListener('resize', this.resizeEvent);
    this.scene.remove.apply(this.scene, this.scene.children);
    this.resTracker.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

}
class WaveScene {
  constructor($scene) {
    this.$scene = $scene;
  }

  init() {
    this.resTracker = new ResourceTracker();
    this.track = this.resTracker.track.bind(this.resTracker);

    this.w = this.$scene.getBoundingClientRect().width,
    this.h = this.$scene.getBoundingClientRect().height;
    this.wave_min = 2;
    this.wave_max = 10;
    this.destination = {x:0, y:0};
    this.time = 0;
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
    this.material = this.track(new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        time: {type:'f'},
        waveLength: {type:'f'},
        mouse: {type:'v2', value: new THREE.Vector2()},
        resolution: {type:'v2', value: new THREE.Vector2()},
        img: {type:'t'},
      },
      vertexShader: vertex_waves,
      fragmentShader: fragment_waves
    }))
    this.plane = new THREE.Mesh(this.track(new THREE.PlaneGeometry(1, 1, 64, 64)), this.material);
    this.scene.add(this.plane);
    
    this.resizeEvent = ()=> {
      this.resize(this.texture)
    }
    this.mousemoveEvent = (event)=> {
      if(!mobile()) {
        this.destination.x = (event.clientX - window.innerWidth/2)/(window.innerWidth/2);
        this.destination.y = (event.clientY - window.innerHeight/2)/(window.innerHeight/2);
      }
    }
    this.checkVisibilityEvent = ()=> {
      let h = this.$scene.getBoundingClientRect().height,
          y = this.$scene.getBoundingClientRect().top,
          v1 = window.innerHeight-y, 
          v2 = h+y;
      if(v1>0 && v2>0 && document.visibilityState=='visible' && !this.visibility) {
        this.visibility = true;
        //visible callback
        if(this.visible_callback) this.visible_callback();
      } else if((v1<0 || v2<0 || document.visibilityState=='hidden') && this.visibility) {
        this.visibility = false;
        //hidden callback
        if(this.hidden_callback) this.hidden_callback();
      }
    }
    this.checkVisibilityEvent();
    this.checkVisibleInterval = setInterval(()=>{
      this.checkVisibilityEvent();
    }, 50)
    //initialized callback
    if(this.initialized_callback) this.initialized_callback();
  }

  resize(texture, speed) {
    this.w = this.$scene.getBoundingClientRect().width;
    this.h = this.$scene.getBoundingClientRect().height;
    this.material.uniforms.resolution.value = new THREE.Vector2(this.w, this.h);
    this.renderer.setSize(this.w,this.h);
    this.camera.aspect = this.w/this.h;
    let scale = texture.image.width/texture.image.height, 
        fov;
    if(this.w/this.h > scale) {
      fov = 2*(180/Math.PI)* (Math.atan((scale/2)/(this.camera.position.z - this.plane.position.z)/this.camera.aspect));
    } else {
      fov = 2*(180/Math.PI)*Math.atan((this.plane.scale.y/2)/(this.camera.position.z - this.plane.position.z));
    }
    if(speed) {
      this.updateCamera = ()=> {
        this.camera.updateProjectionMatrix();
        this.updateCameraFrame = requestAnimationFrame(this.updateCamera);
      }
      this.updateCamera();
      gsap.timeline()
        .to(this.plane.scale, {x:scale, duration:speed, ease:'power2.inOut'})
        .to(this.camera, {fov:fov*0.9, duration:speed, ease:'power2.inOut'}, `-=${speed}`)
        .eventCallback('onComplete', ()=>{
          cancelAnimationFrame(this.updateCameraFrame);
        })
    } 
    else {
      this.plane.scale.x = scale;
      this.camera.fov = fov*0.9;
      this.camera.updateProjectionMatrix();
    }
  }

  render() {
    let style = window.getComputedStyle(this.renderer.domElement, null);
    if(this.visibility && style.visibility=='visible') {
      this.time+=0.04;
      this.material.uniforms.time.value = this.time;
      this.material.uniforms.mouse.value.x += (this.destination.x - this.material.uniforms.mouse.value.x)*0.025;
      this.material.uniforms.mouse.value.y += (this.destination.y - this.material.uniforms.mouse.value.y)*0.025;
      this.renderer.render(this.scene, this.camera);
    } 
    this.animationFrame = requestAnimationFrame(()=>{this.render()});
  }

  start(texture, index) {
    this.textures = [];
    this.texture = this.textures[index] = this.track(new THREE.TextureLoader().load(texture, ()=>{
      this.material.uniforms.img.value = this.texture;
      this.resize(this.texture);
      this.render();
      window.addEventListener('resize', this.resizeEvent);
      window.addEventListener('mousemove', this.mousemoveEvent);
      //callback
      if(this.started_callback) this.started_callback();
    }))
  }

  show(speed) {
    gsap.timeline()
      .to(this.renderer.domElement, {autoAlpha:1, duration:speed, ease:'power1.inOut'}) 
      .fromTo(this.material.uniforms.waveLength, {value:this.wave_max}, {value:this.wave_min, duration:speed, ease:'power1.out'}, `-=${speed}`)
      .eventCallback('onComplete', ()=>{
        //callback
        if(this.showed_callback) this.showed_callback();
      })
  }

  change(texture, index, speed) {
    let animation = gsap.timeline()
      .fromTo(this.material.uniforms.waveLength, {value:this.wave_min}, {immediateRender:false, value:this.wave_max, duration:speed/2, ease:'power1.out'})
      .fromTo(this.renderer.domElement, {autoAlpha:1}, {immediateRender:false, autoAlpha:0, duration:speed/2, ease:'power2.out'}, `-=${speed/2}`)
    
    if(this.textures[index] && this.textures[index].image) {
      animation.eventCallback('onComplete', ()=>{
        this.texture = this.textures[index];
        this.material.uniforms.img.value = this.texture;
        this.show(speed/2);
      })
    } else {
      this.texture = this.textures[index] = this.track(new THREE.TextureLoader().load(texture, ()=>{
        if(animation.progress()==1) {
          this.material.uniforms.img.value = this.texture;
          this.show(speed/2);
        } else {
          animation.eventCallback('onComplete', ()=>{
            this.material.uniforms.img.value = this.texture;
            this.show(speed/2);
          })
        }
      }))
    }
  }

  on(callback, func) {
    if(callback=='initialized') {
      this.initialized_callback = func;
    } else if(callback=='visible') {
      this.visible_callback = func;
    } else if(callback=='hidden') {
      this.hidden_callback = func;
    } else if(callback=='started') {
      this.started_callback = func;
    } else if(callback=='showed') {
      this.showed_callback = func;
    } 
  }

  destroy() {
    cancelAnimationFrame(this.updateCameraFrame);
    cancelAnimationFrame(this.animationFrame);
    clearInterval(this.checkVisibleInterval);
    window.removeEventListener('resize', this.resizeEvent);
    window.removeEventListener('mousemove', this.mousemoveEvent);
    this.scene.remove.apply(this.scene, this.scene.children);
    this.resTracker.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}