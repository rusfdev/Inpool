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
import { disablePageScroll, enablePageScroll } from 'scroll-lock';
import SlimSelect from 'slim-select';

const brakepoints = {
  sm: 576,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1600
}
const dev = false;
const Speed = 1; //seconds
const autoslide_interval = 7; //seconds

const $wrapper = document.querySelector('.wrapper');
const $content = document.querySelector('.content');
const $header = document.querySelector('.header');
const $body = document.body;
const $html = document.documentElement;

//bg
const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-bg');
const bg_dark = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-darker');

//get width
const contentWidth = ()=> {
  return $wrapper.getBoundingClientRect().width;
}
//check device
function mobile() {
  if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    return true;
  } else {
    return false;
  }
}
//request
function httpGetAsync(url, callback) {
  let req = new XMLHttpRequest();
  req.onreadystatechange = function() { 
    if (req.readyState == 4 && req.status == 200) callback(req);       
  }
  req.open("GET", url, true);
  req.send(null);
}
//url clean
function cleanUp(url) {
  var url = $.trim(url);
  if(url.search(/^https?\:\/\//) != -1)
      url = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i, "");
  else
      url = url.match(/^([^\/?#]+)(?:[\/?#]|$)/i, "");
  return url[1];
}

//scroll btn
document.addEventListener('click', (event)=>{
  let $btn = event.target!==document?event.target.closest('[data-scroll]'):null;
  if($btn) {
    let target = $btn.getAttribute('data-scroll'),
        y;
    if(target=='bottom') {
      let $parent = $btn.closest('.section');
      y = $parent.getBoundingClientRect().top + $parent.getBoundingClientRect().height + Scroll.y;
    } else {
      let $target = document.querySelector(target);
      y = $target.getBoundingClientRect().top + Scroll.y;
    }
    if(window.innerWidth<brakepoints.md) {
      y-=70;
    }
    Scroll.scrollTop(y, Speed*1.5)
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
    //functions
    Scroll.init();
    lazySizes.init();
    TouchHoverEvents.init();
    Header.init();
    Nav.init();
    Validation.init();
    Modal.init();
    Cursor.init();

    window.addEventListener('enter', ()=>{
      if(Pages[this.namespace]) Pages[this.namespace].init();
      Select.init();
      Inputmask({
        mask: "+7 999 999-99-99",
        showMaskOnHover: false,
        clearIncomplete: false
      }).mask("[data-validate='phone']");
    })

    window.addEventListener('enter_finish', ()=>{
      $wrapper.classList.remove('disabled');
    })

    window.addEventListener('exit', ()=>{
      $wrapper.classList.add('disabled');
      $header.classList.remove('header_fixed', 'header_hidden');
    })

    window.addEventListener('exit_finish', ()=>{
      if(Pages[this.namespace]) Pages[this.namespace].destroy();
      Select.destroy();
      Scroll.scrollTop(0, 0);
    })

    if(mobile()) {
      mobileWindow.init();
    } else {
      Parralax.init();
      DistortionImages.init();
    }

    Preloader.finish(()=>{
      Transitions.active = true;
      Transitions.enter(this.$container, this.namespace);
    });
  }
}

const Transitions = {
  /* ENTER */
  enter: function($container, namespace) {
    App.$container = $container;
    App.namespace = namespace;
    App.name = App.$container.getAttribute('data-name');
    //event
    window.dispatchEvent(new Event("enter"));
    //animation
    setTimeout(()=>{
      this.animation = gsap.timeline()  
        .to($container, {duration:Speed*1.4 ,autoAlpha:1, ease:'power2.inOut'})
        .eventCallback('onComplete', ()=>{
          this.active = false;
          window.dispatchEvent(new Event("enter_finish"));
        })
    }, 100);
  },
  /* EXIT */
  exit: function($container) {
    this.active = true;
    //event
    window.dispatchEvent(new Event("exit"));
    //animation
    this.animation = gsap.timeline()
      .to($container, {duration:Speed ,autoAlpha:0, ease:'power2.inOut'})
      .to($body, {css:{backgroundColor:bg}, duration:Speed, ease:'none'}, `-=${Speed}`)
      .eventCallback('onComplete', ()=>{
        window.dispatchEvent(new Event("exit_finish"));
        barba.done();
      })
  }
}

const Pages = {
  home: {
    init: function() {
      Splitting();
      HomeBanner.init();
      //slider1
      let $slider1 = document.querySelector('.conceptions');
      if($slider1) {
        if(window.innerWidth>=brakepoints.lg) {
          this.dcslider = new desktopConceptionsSlider($slider1);
        } else {
          this.dcslider = new mobileConceptionsSlider($slider1);
        }
        this.dcslider.init();
      }
      //slider2
      let $slider2 = App.$container.querySelector('.technologies-slider');
      if($slider2) {
        this.tslider = new Slider($slider2, 'wave');
        this.tslider.init();
      }
      //map
      let $map = App.$container.querySelector('.contacts ');
      if($map) {
        this.$map = new Map($map);
        this.$map.init();
      }
    },
    destroy: function() {
      HomeBanner.destroy();
      if(this.dcslider) {
        this.dcslider.destroy();
        delete this.dcslider;
      }
      if(this.tslider) {
        this.tslider.destroy();
        delete this.tslider;
      }
      if(this.$map) {
        this.$map.destroy();
        delete this.$map;
      }
    }
  },
  conception: {
    init: function() {
      //video
      if(!mobile()) {
        let $parent = App.$container.querySelector('.home-screen'),
            $button = App.$container.querySelector('.home-standart__play-btn');
        if($parent && $button) {
          this.video = new HomeScreenVideo($parent);
          this.video.init();
        }
      } else {
        let $homeimage = App.$container.querySelector('.home-screen__background .image');
        gsap.timeline()
          .fromTo($homeimage, {scale:1.2}, {scale:1, duration:Speed*1.5, ease:'power2.out'})
          .fromTo($homeimage, {autoAlpha:0}, {autoAlpha:1, duration:Speed*1.5, ease:'power2.inOut'}, `-=${Speed*1.5}`)
      }
      //slider
      let $slider = App.$container.querySelector('.conceptions-slider');
      if($slider) {
        this.slider = new Slider($slider, 'distortion');
        this.slider.init();
      }
    },
    destroy: function() {
      if(this.video) {
        this.video.destroy();
        delete this.video;
      }
      if(this.slider) {
        this.slider.destroy();
        delete this.slider;
      }
    }
  },
  equipment: {
    init: function() {
      //scene
      let $scene = App.$container.querySelector('.home-screen__scene');
      if($scene) {
        this.scene = new BackgroundScene($scene)
        this.scene.init();
      }
    },
    destroy: function() {
      //scene
      if(this.scene) {
        this.scene.destroy();
        delete this.scene;
      }
    }
  },
  technology: {
    init: function() {
      //scene
      let $scene = App.$container.querySelector('.home-screen__scene');
      if($scene) {
        this.scene = new BackgroundScene($scene)
        this.scene.init();
      }
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
      if(this.scene) {
        this.scene.destroy();
        delete this.scene;
      }
      //scales
      this.scales.destroy();
      delete this.scales;
    }
  },
  portfolio: {
    init: function() {
      let $sliders = App.$container.querySelectorAll('.portfolio-section');
      if($sliders.length) {
        this.sliders = [];
        $sliders.forEach(($slider, index)=>{
          this.sliders[index] = new Slider($slider, 'distortion', 'portfolio');
          this.sliders[index].init();
        })
      }
    },
    destroy: function() {
      if(this.sliders) {
        for (let slider of this.sliders) {
          slider.destroy();
        }
      }
    }
  },
  contacts: {
    init: function() {
      let $map = App.$container.querySelector('.contacts ');
      if($map) {
        this.$map = new Map($map);
        this.$map.init();
      }
    },
    destroy: function() {
      if(this.$map) this.$map.destroy();
    }
  }
}

const Select = {
  init: function() {
    this.selects = {};
    let $select = App.$container.querySelectorAll('.select');
    $select.forEach(($element, index)=>{
      this.selects[index] = new SlimSelect({
        select: $element,
        searchText: 'Совпадений не найдено...',
        searchPlaceholder: 'Поиск по городам',
        showContent: 'down',
        searchFocus: false
      })

      let $scroll = document.createElement('div');
      $scroll.classList.add('scroll');
      this.selects[index].slim.content.insertAdjacentElement('beforeEnd', $scroll);
      $scroll.insertAdjacentElement('beforeEnd', this.selects[index].slim.list);
      if(!mobile()) {
        this.selects[index].scrollbar = Scrollbar.init($scroll, {
          damping: 0.1
        })
      }
    })
  },
  destroy: function() {
    for(let key in this.selects) {
      if(this.selects[key].scrollbar) this.selects[key].scrollbar.destroy();
      this.selects[key].destroy();
    }
    delete this.selects;
  }
}

const Preloader = {
  min_loading_time: Speed*2, 
  finish_speed: Speed, 
  finish: function(callback) {
    if(dev) {
      this.min_loading_time = 0;
      this.finish_speed = 0;
    }

    let delay = Math.max(this.min_loading_time-loading_duration/1000, 0);

    this.animation = gsap.timeline({paused:true})
      .set([$prelaoder, $chars, $square], {css:{transition:'none'}})
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

const Scroll = {
  init: function() {
    this.y = 0;
    if(mobile()) this.native();
    else this.custom(); 
    window.addEventListener('exit', ()=>{
      this.scrollTop(Math.max(Scroll.y-window.innerHeight/2, 0), Speed);
    })
  },
  custom: function() {
    this.type='custom';
    $html.style.cssText = 'height:100%;width:100%;position:fixed;'
    $body.style.height = '100%';
    $wrapper.style.height = '100%';
    $content.style.height = '100%';
    $content.style.display = 'block';
    this.scrollbar = Scrollbar.init($content, {
      damping: 0.1,
      thumbMinSize: 150
    })
    this.scrollbar.addListener(()=>{
      if(dev) localStorage.setItem('scroll', this.scrollbar.offset.y);
      this.y = this.scrollbar.offset.y;
    })
    //old scroll
    let sy = +localStorage.getItem('scroll');
    if(sy>0 && dev) {
      this.scrollbar.setPosition(0, sy);
    }
    window.addEventListener('enter', ()=>{
      this.scrollbar.track.yAxis.element.classList.remove('show');
    })
  },
  native: function() {
    this.type='native';
    window.addEventListener('scroll', ()=>{
      this.y = window.pageYOffset;
    })
    window.addEventListener('enter_finish', ()=>{
      $body.style.overflow = 'auto';
    })
    window.addEventListener('exit', ()=>{
      $body.style.overflow = 'hidden';
    })
  },
  scrollTop: function(y, speed) {
    if(speed>0) this.inScroll=true;
    //custom
    if(this.type=='custom') {
      this.animation = gsap.to(this.scrollbar, {scrollTop:y, duration:speed, ease:'power2.inOut'});
      if(speed>0) {
        this.animation.eventCallback('onComplete', ()=>{
          this.inScroll=false;
        })
      }
    } 
    //native
    else {
      let scroll = {y:this.y};
      if(speed>0) {
        this.animation = gsap.to(scroll, {y:y, duration:speed, ease:'power2.inOut', onComplete:()=>{
          this.inScroll=false;
          cancelAnimationFrame(this.frame);
        }})
        this.checkScroll = ()=>{
          window.scrollTo(0, scroll.y);
          this.frame = requestAnimationFrame(()=>{this.checkScroll()});
        }
        this.checkScroll();
      } else {
        window.scrollTo(0, y);
      }
      
    }
  },
  stop: function() {
    this.inScroll=false;
    if(this.animation) this.animation.pause();
    if(this.frame) cancelAnimationFrame(this.frame);
  },
  addListener: function(func) {
    if(this.type=='custom') {
      this.scrollbar.addListener(func);
    } else {
      window.addEventListener('scroll', func);
    }
  }, 
  removeListener: function(func) {
    if(this.type=='custom') {
      this.scrollbar.removeListener(func);
    } else {
      window.removeEventListener('scroll', func);
    }
  }
}

//hover/touch custom events
const TouchHoverEvents = {
  targets: 'a, button, label, tr, .jsTouchHover, .scrollbar-thumb, .scrollbar-track, .ss-option',
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
        for(let $target of $targets) $target.setAttribute('data-touch', '');
      }
    } 
    //touchend
    else if(event.type=='touchend' || (event.type=='contextmenu' && this.touched)) {
      this.timeout = setTimeout(() => {this.touched = false}, 500);
      if($targets[0]) {
        setTimeout(()=>{
          for(let $target of $targets) {
            $target.dispatchEvent(new CustomEvent("customTouchend"));
            $target.removeAttribute('data-touch');
          }
        }, this.touchEndDelay)
      }
    } 
    
    //mouseenter
    if(event.type=='mouseenter' && !this.touched && $targets[0] && $targets[0]==event.target) {
      $targets[0].setAttribute('data-hover', '');
      if(Cursor.desktop) Cursor.enter();
    }
    //mouseleave
    else if(event.type=='mouseleave' && !this.touched && $targets[0] && $targets[0]==event.target) {
      $targets[0].removeAttribute('data-focus');
      $targets[0].removeAttribute('data-hover');
      if(Cursor.desktop) Cursor.leave();
    }
    //mousedown
    if(event.type=='mousedown' && !this.touched && $targets[0]) {
      $targets[0].setAttribute('data-focus', '');
    } 
    //mouseup
    else if(event.type=='mouseup' && !this.touched  && $targets[0]) {
      $targets[0].removeAttribute('data-focus');
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
        disablePageScroll();
        this.opened = true;
        this.$toggle_items.forEach(($item, index)=>{
          $item.setAttribute('d', this.button_forms[1])
        })
      }, 
      onReverseComplete:()=>{
        enablePageScroll();
        this.opened = false;
        this.$toggle_items.forEach(($item, index)=>{
          $item.setAttribute('d', this.button_forms[0])
        })
      }
    })
      .set(this.$nav, {autoAlpha:1})
      .to(this.$toggle_lines[1], {autoAlpha:0, duration:Speed/2, ease:'power2.inOut'})
      .to(this.$toggle_lines[1], {xPercent:-100, duration:Speed/2, ease:'power2.in'}, `-=${Speed/2}`)
      .to(this.$toggle_lines[0], {rotate:45, y:8.5, duration:Speed/2, ease:'power2.out'}, `-=${Speed/2}`)
      .to(this.$toggle_lines[2], {rotate:-45, y:-8.5, duration:Speed/2, ease:'power2.out'}, `-=${Speed/2}`)
      //
      .fromTo(this.$bg, {autoAlpha:0}, {autoAlpha:1, duration:Speed/2, ease:'power2.out'}, `-=${Speed/2}`)
      .fromTo(this.$container, {xPercent:100}, {xPercent:0, duration:Speed/2, ease:'power2.out'}, `-=${Speed/2}`)
      .fromTo(this.$nav_items, {autoAlpha:0}, {autoAlpha:1, duration:Speed*0.4, ease:'power2.inOut', stagger:{amount:Speed*0.1, from:'random'}}, `-=${Speed/2}`)

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
    window.addEventListener('resize', ()=>{
      this.setSize()
    });
    window.addEventListener('enter', ()=>{
      this.change(App.name);
    })
    window.addEventListener('exit', ()=>{
      if(this.state) this.close();
    })
  },
  checkToggleButton: function(event) {
    if(!this.opened) {
      if((event.type=='mouseenter' && !TouchHoverEvents.touched)) {
        this.$toggle_items.forEach(($item, index)=>{
          $item.setAttribute('d', this.button_forms[2]);
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
    this.animation.play();
  },
  close: function() {
    $header.classList.remove('header_nav-opened');
    this.state=false;
    this.animation.reverse();
  },
  setSize: function() {
    if(window.innerWidth>=brakepoints.md) {
      let cw = document.querySelector('.container').getBoundingClientRect().width,
          w2 = (contentWidth()-cw)/2,
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
    Scroll.addListener(()=>{
      this.check();
    })
    this.check();
  }, 
  check: function() {
    if(Scroll.y>0 && !this.fixed) {
      this.fixed = true;
      $header.classList.add('header_fixed');
    } else if(Scroll.y==0 && this.fixed) {
      this.fixed = false;
      $header.classList.remove('header_fixed');
    }
  }
}

const Parralax = {
  init: function() {
    this.initialized = true;
    Scroll.addListener(()=>{
      requestAnimationFrame(()=>{this.check();})
    })
    window.addEventListener('enter', ()=>{
      setTimeout(()=>{
        this.check();
      }, 100);
    })
  },
  check: function() {
    let $items = App.$container.querySelectorAll('[data-parralax]');
    $items.forEach(($this)=>{
      let y = $this.getBoundingClientRect().y,
          h1 = window.innerHeight,
          h2 = $this.getBoundingClientRect().height,
          scroll = Scroll.y,
          factor = +$this.getAttribute('data-parralax'),
          val;
      if($this.getAttribute('data-parralax-top')==null) {
        val = ((scroll+h1/2) - (y+scroll+h2/2)) * factor;
      } else {
        val = scroll * factor;
      }
      $this.style.transform = `translate3d(0, ${val}px, 0)`;
    })
  }
}

const HomeBanner = {
  init: function() {
    this.$parent = App.$container.querySelector('.home-banner'),
    this.$titles = this.$parent.querySelectorAll('.home-banner__slide-title'),
    this.$paginations = this.$parent.querySelectorAll('.pagination__button');
    this.$scene = this.$parent.querySelector('.home-screen__scene');
    this.$images = this.$scene.querySelectorAll('.image');
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

    this.speed = Speed*1.5;
    //DESKTOP
    if(!mobile()) {
      this.textures = [];
      this.$images.forEach(($image, index)=>{
        this.textures[index] = $image.querySelector('img').getAttribute('data-src');
        $image.style.display = 'none';
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
      this.animations_img = [];
      this.$images.forEach(($image, index)=>{
        this.animations_img[index] = gsap.timeline({paused:true})
          .fromTo($image, {scale:1.2}, {scale:1, duration:this.speed, ease:'power2.out'})
          .fromTo($image, {autoAlpha:0}, {autoAlpha:1, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
      })
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
        .fromTo($chars, {y:20}, {y:0, duration:(this.speed/2)*0.8, ease:'power2.out', stagger:{amount:(this.speed/2)*0.2}}) 
        .fromTo($chars, {autoAlpha:0}, {autoAlpha:1, duration:(this.speed/2)*0.8, ease:'power2.inOut', stagger:{amount:(this.speed/2)*0.2}}, `-=${(this.speed/2)}`) 
      this.animations_exit[index] = gsap.timeline({paused:true, onStart:()=>{this.inAnimation=true;}})
        .to($chars, {y:-20, duration:(this.speed/2)*0.8, ease:'power1.in', stagger:{amount:(this.speed/2)*0.2}})
        .to($chars, {autoAlpha:0, duration:(this.speed/2)*0.8, ease:'power2.inOut', stagger:{amount:(this.speed/2)*0.2}}, `-=${(this.speed/2)}`)
        .set($title, {autoAlpha:0})
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
          //desktop
          if(this.scene) this.scene.show(this.speed);
          //mobile
          if(this.animations_img) this.animations_img[this.index].play();
        } else {
          this.$paginations[this.old].classList.remove('active');
          this.animations_exit[this.old].play(0).eventCallback('onComplete', ()=>{
            this.animations_enter[this.index].play(0);
          })
          //desktop
          if(this.scene) this.scene.change(this.textures[this.index], this.index, this.speed);
          //mobile
          if(this.animations_img) {
            this.animations_img[this.old].reverse();
            this.animations_img[this.index].play();
          }
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
      else if(dir.right) this.change(this.getPrev());
    });
    //start
    this.change(this.index);
  },
  destroy: function() {
    clearInterval(this.checkVisibleInterval);
    clearTimeout(this.timeout);
    if(this.scene) this.scene.destroy();
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

    if(mobile()) {
      this.mobile = true;
      this.$parent.classList.add('trigger-round_mobile');
    } 
    
    else {
      this.desktop = true;
      this.$parent.classList.add('trigger-round_desktop');
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
          .to(this.$parent, {duration:Speed/2,x:x,y:y,ease:'power2.out'})
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
    }

    window.addEventListener('exit', ()=>{
      if(!dev) Cursor.loading_start();
    })
    window.addEventListener('enter', ()=>{
      if(!this.initialized) {
        if(this.desktop && !dev) gsap.to(this.$parent, {autoAlpha:1, duration:Speed*1.5, ease:'power2.inOut'});
        this.initialized = true;
      } else {
        if(!dev) this.loading_finish();
      }
    })

  },
  enter: function() {
    this.$parent.classList.add('hover');
  },
  leave: function() {
    this.$parent.classList.remove('hover');
  },
  loading_start: function() {
    this.$parent.classList.add('loading');
    gsap.timeline()
      .fromTo(this.$parent, {rotation:0}, {rotation:420, duration:Speed*0.9, ease:'power2.in'})
      .fromTo(this.$element, {css:{'stroke-dashoffset':0}}, {css:{'stroke-dashoffset':this.circumference*0.9}, duration:Speed*0.9, ease:'power2.in'}, `-=${Speed*0.9}`)
      .to(this.$parent, {autoAlpha:0, duration:Speed*0.5, ease:'power2.in'}, `-=${Speed*0.5}`)
      .set(this.$element, {css:{'stroke-dashoffset':this.circumference*0.75}})
    
  },
  loading_finish: function() {
    let anim = gsap.timeline()
      .to(this.$parent, {rotation:1080, duration:Speed*1.5, ease:'power2.out'})
      .to(this.$parent, {autoAlpha:1, duration:Speed*0.25, ease:'power2.out'}, `-=${Speed*1.5}`)
      .to(this.$element, {css:{'stroke-dashoffset':0}, duration:Speed, ease:'power2.inOut'}, `-=${Speed}`)
      .set(this.$parent, {rotation:0})
    if(this.mobile) {
      setTimeout(()=>{
        this.$parent.classList.remove('loading');
      }, Speed*1000)
    } else {
      anim.eventCallback('onComplete', ()=>{
        this.$parent.classList.remove('loading');
      })
    }
  }
}

class BackgroundScene {
  constructor($scene) {
    this.$scene = $scene;
  }
  init() {
    let $image = this.$scene.querySelector('.image');
    if(!mobile()) {
      $image.style.display = 'none';
      let texture = $image.querySelector('img').getAttribute('data-src');
      this.scene = new WaveScene(this.$scene);
      this.scene.on('visible', ()=>{
        if(!this.flag) {
          this.flag = true;
          this.scene.start(texture);
        }
      })
      this.scene.on('started', ()=>{
        this.scene.show(Speed);
      })
      this.scene.init();
    } else {
      gsap.timeline()
        .fromTo($image, {scale:1.2}, {scale:1, duration:Speed*1.5, ease:'power2.out'})
        .fromTo($image, {autoAlpha:0}, {autoAlpha:1, duration:Speed*1.5, ease:'power2.inOut'}, `-=${Speed*1.5}`)
    }
  }
  destroy() {
    if(this.scene) this.scene.destroy();
    for(let child in this) delete this[child];
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
        gsap.fromTo(this.$video, {autoAlpha:0}, {autoAlpha:1, duration:Speed, ease:'power2.inOut'})
      }
    }

    this.resizeEvent();
    this.checkPauseEvent();
    window.addEventListener('resize', this.resizeEvent);
    Scroll.addListener(this.checkPauseEvent)
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
    Scroll.removeListener(this.checkPauseEvent)
    document.removeEventListener("visibilitychange", this.checkPauseEvent);
    for(let child in this) delete this[child];
  }

}

class HomeScreenVideo {
  constructor($parent) {
    this.$parent = $parent;
  }
  init() {
    //remove image
    this.$parent.querySelector('.image').remove();

    this.$open = this.$parent.querySelector('.home-standart__play-btn');
    this.$bg = this.$parent.querySelector('.home-screen__background');

    //create
    let video = this.$open.getAttribute('href');
    this.$bg.insertAdjacentHTML('afterbegin', 
      `<div class="video-scene">
        <div class="video-scene__controls container">
          <button class="video-scene__close" aria-label="close video"></button>
          <div class="video-scene__timeline"><span></span></div>
        </div>
        <div class="video-scene__wrapper" data-parralax="0.35" data-parralax-top>
          <video class="video-scene__player">
            <source src=${video} type="video/mp4">
          </video>
        </div>
      </div>`
    )

    this.$open.removeAttribute('data-modal');
    this.$open.setAttribute('href', 'javascript:void(0);');

    this.state = false;
    this.$scene = this.$parent.querySelector('.video-scene');
    this.$player = this.$parent.querySelector('.video-scene__player');
    this.$close = this.$parent.querySelector('.video-scene__close');
    this.$container = this.$parent.querySelector('.home-screen__container');
    this.$gradient = this.$parent.querySelector('.home-standart__gradient');
    this.controls = this.$parent.querySelector('.video-scene__controls');
    this.timeline = this.$parent.querySelector('.video-scene__timeline span');

    this.openAnimation = gsap.timeline({paused:true})
      .to([this.$container, this.$gradient], {autoAlpha:0, duration:Speed, ease:'power2.inOut'})
      .to(this.controls, {autoAlpha:1, duration:Speed/2, ease:'power2.inOut'})

    this.openEvent = (event)=> {
      this.open(event);
    }
    this.closeEvent = ()=> {
      this.close();
    }
    
    this.$open.addEventListener('click', this.openEvent);
    this.$close.addEventListener('click', this.closeEvent);
    window.addEventListener('exit', this.closeEvent);
    
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

  }
  open(event) {
    event.preventDefault();
    this.state = true;
    this.openAnimation.play();
    Scroll.scrollTop(0, Speed);
    gsap.timeline()
      .to(this.$player, {autoAlpha:0, duration:Speed, ease:'power2.inOut'})
      .to(this.$player, {autoAlpha:1, duration:Speed/2, ease:'power2.inOut'})
    setTimeout(()=>{
      this.video.$video.volume = 1;
      this.video.$video.muted = false;
      this.video.$video.currentTime = 0;
    }, Speed*1000)
  
  }
  close() {
    this.state = false;
    gsap.to(this.video.$video, {volume:0, duration:2, ease:'power2.none', onComplete:()=>{
      if(this.video) this.video.$video.muted = true;
    }})
    this.openAnimation.reverse();
  }
  destroy() {
    this.video.destroy();
    clearInterval(this.interval)
    this.$open.removeEventListener('click', this.openEvent);
    this.$close.removeEventListener('click', this.closeEvent);
    window.removeEventListener('exit', this.closeEvent);
    for(let child in this) delete this[child];
  }
}

const Validation = {
  init: function () {
    this.namspaces = {
      name: 'name',
      phone: 'phone',
      email: 'email',
      message: 'message'
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
          pattern: /^\+7 \d{3}\ \d{3}\-\d{2}-\d{2}$/,
          message: '^Введите корректный номер телефона'
        }
      },
      email: {
        presence: {
          allowEmpty: false,
          message: '^Введите ваш email'
        },
        email: {
          message: '^Неправильный формат email-адреса'
        }
      },
      message: {
        presence: {
          allowEmpty: false,
          message: '^Введите ваше сообщение'
        },
        length: {
          minimum: 2,
          tooShort: "^Сообщение слишком короткое (минимум %{count} символа)",
          maximum: 100,
          tooLong: "^Сообщение слишком длинное (максимум %{count} символов)"
        }
      }
    };
    this.mask = Inputmask({
      mask: "+7 999 999-9999",
      showMaskOnHover: false,
      clearIncomplete: false
    }).mask("[data-validate='phone']");

    gsap.registerEffect({
      name: "fadeMessages",
      effect: ($message) => {
        return gsap.timeline({
          paused: true
        }).fromTo($message, {
          autoAlpha: 0
        }, {
          autoAlpha: 1,
          duration: 0.3,
          ease: 'power2.inOut'
        })
      }
    });

    document.addEventListener('submit', (event) => {
      let $form = event.target,
        $inputs = $form.querySelectorAll('input, textarea'),
        l = $inputs.length,
        i = 0;
      while (i < l) {
        if ($inputs[i].getAttribute('data-validate')) {
          event.preventDefault();
          let flag = 0;
          $inputs.forEach(($input) => {
            if (!this.validInput($input)) flag++;
          })
          if (!flag) this.submitEvent($form);
          break;
        } else i++
      }
    })

    document.addEventListener('input', (event) => {
      let $input = event.target,
        $parent = $input.parentNode;
      if ($parent.classList.contains('error')) {
        this.validInput($input);
      }
    })

  },
  validInput: function ($input) {
    let $parent = $input.parentNode,
      type = $input.getAttribute('data-validate'),
      required = $input.getAttribute('data-required') !== null,
      value = $input.value,
      empty = validate.single(value, {
        presence: {
          allowEmpty: false
        }
      }) !== undefined,
      resault;

    for (let key in this.namspaces) {
      if (type == key && (required || !empty)) {
        resault = validate.single(value, this.constraints[key]);
        break;
      }
    }
    //если есть ошибки
    if (resault) {
      if (!$parent.classList.contains('error')) {
        $parent.classList.add('error');
        $parent.insertAdjacentHTML('beforeend', `<span class="input__message">${resault[0]}</span>`);
        let $message = $parent.querySelector('.input__message');
        gsap.effects.fadeMessages($message).play();
      } else {
        $parent.querySelector('.input__message').textContent = `${resault[0]}`;
      }
      return false;
    }
    //если нет ошибок
    else {
      if ($parent.classList.contains('error')) {
        $parent.classList.remove('error');
        let $message = $parent.querySelector('.input__message');
        gsap.effects.fadeMessages($message).reverse(1).eventCallback('onReverseComplete', () => {
          $message.remove();
        });
      }
      return true;
    }
  },
  reset: function ($form) {
    let $inputs = $form.querySelectorAll('input, textarea');
    $inputs.forEach(($input) => {
      $input.value = '';

      let $parent = $input.parentNode;
      if ($parent.classList.contains('focused')) {
        $parent.classList.remove('focused');
      }
      if ($parent.classList.contains('error')) {
        $parent.classList.remove('error');
        let $message = $parent.querySelector('.input__message');
        gsap.effects.fadeMessages($message).reverse(1).eventCallback('onReverseComplete', () => {
          $message.remove();
        });
      }
    })
  },
  submitEvent: function ($form) {
    let $submit = $form.querySelector('.button_submit');
    $form.classList.add('loading');
    $submit.classList.add('loading');
    $($form).request('onSend', {
      success: ()=>{
        $form.classList.remove('loading');
        $submit.classList.remove('loading');
        this.reset($form);
        let modal = document.querySelector('#succes');
        Modal.open(modal);
        setTimeout(()=>{
          Modal.close();
        }, 3000)
      }
    })
  }
}

const Modal = {
  init: function() {
    gsap.registerEffect({
      name: "modal",
      effect: ($modal, $content) => {
        let anim = gsap.timeline({paused:true})
          .fromTo($modal, {autoAlpha:0}, {autoAlpha:1, duration:Speed/2, ease:'power2.inOut'})
          .fromTo($content, {y:20}, {y:0, duration:Speed, ease:'power2.out'}, `-=${Speed/2}`)
        return anim;
      },
      extendTimeline: true
    });
    
    document.addEventListener('click', (event)=>{
      let $open = event.target.closest('[data-modal="open"]'),
          $close = event.target.closest('[data-modal="close"]'),
          $video_open = event.target.closest('[data-modal="video"]'),
          $wrap = event.target.closest('.modal'),
          $block = event.target.closest('.modal-block');
    
      //open
      if($open) {
        event.preventDefault();
        let $modal = document.querySelector(`${$open.getAttribute('href')}`),
            value = $open.getAttribute('data-modal-value');
        this.open($modal, value);
      }
      //video
      else if($video_open) {
        event.preventDefault();
        let href = $video_open.getAttribute('href');
        this.video(href);
      }
      //close 
      else if($close || (!$block && $wrap)) {
        this.close();
      } 
    })

    window.addEventListener('exit', ()=>{
      if(this.$active) this.close();
    })

  }, 
  open: function($modal, value) {
    let play = ()=> {
      this.$active = $modal;
      disablePageScroll();
      $header.classList.add('header_modal-opened');
      let $content = $modal.querySelector('.modal-block');
      this.animation = gsap.effects.modal($modal, $content);
      this.animation.play();
      //succes
      if($modal.classList.contains('modal-succes')) {
        let $icon = $modal.querySelector('path'),
            w = $icon.getTotalLength();
        gsap.timeline()
          .set($icon, {autoAlpha:0})
          .set($icon, {css:{'stroke-dasharray':w}}, `+=${Speed*0.25}`)
          .set($icon, {autoAlpha:1})
          .fromTo($icon, {css:{'stroke-dashoffset':w}}, {duration:Speed, css:{'stroke-dashoffset':0}, ease:'power2.out'})
      }

      //значение формы
      if(value) {
        let $hidden_input = $modal.querySelector('.form__hidden');
        if($hidden_input) {
          $hidden_input.value = value;
        }
      }
    }

    if($modal) {
      if(this.$active) this.close(play);
      else play();
    }
  }, 
  close: function(callback) {
    if(this.$active) {
      this.animation.timeScale(2).reverse().eventCallback('onReverseComplete', ()=>{
        delete this.animation;
        enablePageScroll();
        $header.classList.remove('header_modal-opened');
        //video
        if(this.$active.classList.contains('modal-video')) this.$active.remove();
        //callback
        delete this.$active;
        if(callback) callback();
      })
      //reset form
      let $form = this.$active.querySelector('form');
      if($form) Validation.reset($form);
    }
  },
  video: function(href) {
    let play = ()=> {
      //create
      $wrapper.insertAdjacentHTML('beforeEnd', 
        `<div class="modal modal-video">
          <div class="modal__wrapper" data-scroll-lock-scrollable="">
            <div class="modal-block modal-video__wrapper">
             <div class='modal-video__container'>
                <video class='modal-video__element' src=${href} controls></video>
              </div>
            </div>
          </div>
        </div>`
      );
      //
      disablePageScroll();
      $header.classList.add('header_modal-opened');
      let $modal = document.querySelector('.modal-video'),
          $content = $modal.querySelector('.modal-block');
      this.$active = $modal;
      
      this.animation = gsap.effects.modal($modal, $content);
      this.animation.play();

    }

    if(href) {
      if(this.$active) this.close(this.$active, play);
      else play();
    }
    
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
    Scroll.addListener(this.listener);
    this.check();
  }
  check() {
    let sy = Scroll.y,
        ty = this.$line.getBoundingClientRect().y,
        h = window.innerHeight;

    if(sy+h > ty+sy && !this.flag) {
      this.flag = true;

      let i = {};
      i.value = 0;

      gsap.timeline()
        .to(this.$line, {css:{width:`${100+this.value}%`}, duration:Speed*1.5, ease:'power2.out'})
        .to(i, {value:this.value, duration:Speed*1.5, ease:'power2.out'}, `-=${Speed*1.5}`)

      let iteration = ()=> {
        this.$value.textContent = `- ${Math.abs(Math.floor(i.value))}%`;
        this.animation = requestAnimationFrame(iteration);
      }
      iteration();

    }
  }
  destroy() {
    Scroll.removeListener(this.listener);
    cancelAnimationFrame(this.animation);
    for(let child in this) delete this[child];
  }
}

class desktopConceptionsSlider {
  constructor($parent) {
    this.$parent = $parent;
  }

  init() {
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
      this.sizingEvent(()=>{
        this.initScrolling();
      });
    });
  }

  sizingEvent(callback) {
    this.h = this.$slider.getBoundingClientRect().height;
    this.factor = 1/(this.h/2);
    this.max_scroll = this.h+6/this.factor;
    this.$parent.style.paddingBottom = `${this.max_scroll-this.h}px`;
    if(callback) callback();
  }

  create_desktop_animation(callback) {
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
          .fromTo(scene.renderer.domElement.parentNode, {autoAlpha:0}, {autoAlpha:1, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
          .fromTo(scene.renderer.domElement.parentNode, {scale:0.9}, {immediateRender:false, scale:1, duration:this.speed, ease:'power2.out'}, `-=${this.speed}`)
    
        timeline_start.add(timeline_image, `>-${this.speed}`)
        //fix1
        if(slide_index==0 && index==0) {
          let timeline_image = gsap.timeline()
            .fromTo(scene.renderer.domElement.parentNode, {xPercent:-5}, {xPercent:0, duration:this.speed, ease:'power2.out'}, `-=${this.speed}`)
          timeline_start.add(timeline_image, `>-${this.speed}`)
        } else if(slide_index==2 && index==1) {
          let timeline_image = gsap.timeline()
            .fromTo(scene.renderer.domElement.parentNode, {xPercent:5}, {xPercent:0, duration:this.speed, ease:'power2.out'}, `-=${this.speed}`)
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
            .to(scene.renderer.domElement.parentNode, {autoAlpha:0, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
            .to(scene.renderer.domElement.parentNode, {immediateRender:false, scale:0.9, duration:this.speed, ease:'power2.in'}, `-=${this.speed}`)
          timeline_end.add(timeline_image, `>-${this.speed}`)
          
          if(slide_index==0 && index==0) {
            let timeline_image = gsap.timeline()
              .to(scene.renderer.domElement.parentNode, {xPercent:-5, duration:this.speed, ease:'power2.in'}, `-=${this.speed}`)
            timeline_end.add(timeline_image, `>-${this.speed}`)
          } else if(slide_index==2 && index==1) {
            let timeline_image = gsap.timeline()
              .to(scene.renderer.domElement.parentNode, {xPercent:5, duration:this.speed, ease:'power2.in'}, `-=${this.speed}`)
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
  }

  initScrolling() {
    this.mouseWheelListener = ()=> {
      if(Scroll.inScroll) Scroll.stop();
    }
    this.scrollListener = (event)=> {
      this.scrollEvent(event);
    }
    this.sizingListener = ()=> {
      this.sizingEvent();
    }
    Scroll.addListener(this.scrollListener);
    window.addEventListener('resize', this.sizingListener);
    window.addEventListener('wheel', this.mouseWheelListener);
  }

  scrollEvent() {
    let y = Scroll.y,
        t = this.$slider.getBoundingClientRect().y,
        scroll = Math.ceil(y-(t+y-this.h));

    //clear
    if(this.autoscroll_timeout) clearTimeout(this.autoscroll_timeout);
        
    if(scroll>=0 && scroll<=this.max_scroll) {

      if(scroll>=this.h) {
        this.animation.seek(1+(scroll-this.h)*this.factor);
        this.fixed = true;
        gsap.set(this.$container, {y:scroll-this.h});
        //autoscroll
        if(!Scroll.inScroll) {
          this.autoscroll_timeout = setTimeout(()=>{
            let points = [1, 3, 5, 7], value;
            for(let index in points) {
              if(Math.abs(points[index] - this.animation.time())<1) {
                value = (y-scroll) + this.h + (points[index]-1)/this.factor;
              }
            }
            Scroll.scrollTop(value, Speed);
          }, 100)
        }
      } else {
        this.animation.seek(scroll/this.h);
        if(this.fixed) {
          this.fixed = false;
          gsap.set(this.$container, {y:0});
        }
      }
    } 

    else if(scroll>this.max_scroll && this.animation.progress()!==1) {
      this.fixed = false;
      this.animation.seek(7);
      gsap.set(this.$container, {y:this.max_scroll-this.h})
    } 
    
    else if(scroll<0 && this.animation.progress()!==0) {
      this.animation.seek(0);
    }

    if(!Transitions.active) {
      if(scroll>this.h/2 && scroll<=this.h) {
        let time = (scroll/this.h*2)-1;
        this.colorAnimation.seek(time);
      } else if(scroll>this.max_scroll && scroll<=this.max_scroll+this.h/2) {
        let time = 1-(scroll-this.max_scroll)/this.h*2;
        this.colorAnimation.seek(time);
      }
    }

    if(!Transitions.active && this.fixed) {
      $header.classList.add('header_hidden');
    } else if(!this.fixed) {
      $header.classList.remove('header_hidden');
    }

  }

  destroy() {
    window.removeEventListener('resize', this.sizingListener)
    window.removeEventListener('wheel', this.mouseWheelListener)
    Scroll.removeListener(this.scrollListener);
    clearTimeout(this.autoscroll_timeout);
    for(let slide_index in this.slides) {
      for(let scene_index in this.slides[slide_index].scenes) {
        this.slides[slide_index].scenes[scene_index].destroy();
      }
    }
    for(let child in this) delete this[child];
  }

}

class mobileConceptionsSlider {
  constructor($parent) {
    this.$parent = $parent;
  }
  init() {
    this.$wrapper = this.$parent.querySelector('.conceptions__slider-wrapper');
    this.$content = this.$parent.querySelector('.conceptions__slides');
    this.$scale = this.$parent.querySelector('.conceptions__scale span');

    this.$scale.style.width = '0';
    this.event = ()=> {
      let w1 = contentWidth(),
          w2 = this.$content.getBoundingClientRect().width,
          x = this.$content.getBoundingClientRect().x;
      let value = -x/(w2-w1)*100;
      this.$scale.style.width = `${value}%`;
    }
    this.$wrapper.addEventListener('scroll', this.event)
  }
  destroy() {
    this.$wrapper.removeEventListener('scroll', this.event);
    for(let child in this) delete this[child];
  }
}

class Slider {
  constructor($parent, animation, type) {
    this.$parent = $parent;
    this.animation = animation;
    this.type = type;
  }

  init() {
    this.index = 0;
    this.$slider = this.$parent.querySelector('.splide');
    this.$scene = this.$parent.querySelector('.slider__scene');
    this.$images = this.$scene.querySelectorAll('.image');
    this.$idx = this.$parent.querySelectorAll('.slider__idx span');
    
    //desktop
    if(!mobile()) {
      this.textures = [];
      this.$images.forEach(($image, index)=>{
        this.textures[index] = $image.querySelector('img').getAttribute('data-src');
        $image.style.display = 'none';
      })
      if(this.animation=='distortion') {
        this.speed = Speed;
        this.scene = new DistortionScene(this.$scene);
      } else if(this.animation=='wave') {
        this.speed = Speed*1.5;
        this.scene = new WaveScene(this.$scene);
      }
      
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
      this.scene.init();
    } else {
      this.speed = Speed;
      this.animations = [];
      this.$images.forEach(($image, index)=>{
        this.animations[index] = gsap.timeline({paused:true})
          .fromTo($image, {scale:1.2}, {scale:1, duration:this.speed, ease:'power2.out'})
          .fromTo($image, {autoAlpha:0}, {autoAlpha:1, duration:this.speed, ease:'power2.inOut'}, `-=${this.speed}`)
      })
      this.animations[this.index].play();
    }

    this.getPrev = (index)=> {
      let val = index==0?this.$images.length-1:index-1;
      return val;
    }

    if(this.type=='portfolio') {
      let start_index = this.index;
      if(window.innerWidth>=brakepoints.lg) {
        start_index = this.index+1;
      }
      this.slider = new Splide(this.$slider, {
        type: 'loop',
        perPage: 6,
        arrows: true,
        pagination: false,
        easing: 'ease-in-out',
        speed: this.speed*1000,
        gap: 24,
        autoplay: true,
        start: start_index,
        perMove: 1,
        interval: 1000*autoslide_interval,
        breakpoints: {
          1024: {
            perPage: 1,
            pagination: true,
            arrows: false
          },
        }
      });
      this.slider.on('click', ($slide)=>{
        this.slider.go($slide.index+1);
      });
    } 
    
    else {
      this.slider = new Splide(this.$slider, {
        type: 'loop',
        perPage: 1,
        arrows: false,
        pagination: true,
        speed: this.speed*1000,
        autoplay: true,
        autoHeight: true,
        perMove: 1,
        interval: 1000*autoslide_interval
      })
    }
    
    this.slider.on('move', (newIndex)=>{
      this.enabled = false;
      let index;
      if(this.type=='portfolio' && window.innerWidth>=brakepoints.lg) {
        index = this.getPrev(newIndex);
      } else {
        index = newIndex;
      }
      //indexes
      if(this.$idx.length) {
        gsap.to(this.$idx[this.index], {autoAlpha:0, duration:this.speed, ease:'power2.inOut'})
        gsap.to(this.$idx[index], {autoAlpha:1, duration:this.speed, ease:'power2.inOut'})
      }
      //desktop
      if(this.scene) {
        this.scene.change(this.textures[index], index, this.speed);
      }
      //mobile 
      else {
        this.animations[this.index].reverse();
        this.animations[index].play();
      }
      this.index = index;
    });

    //swipe
    this.swipes = SwipeListener(this.$scene);
    this.$scene.addEventListener('swipe', (event)=> {
      let dir = event.detail.directions;
      if(dir.left) this.slider.go('+')
      else if(dir.right) this.slider.go('-')
    });

    this.slider.mount();
  }

  destroy() {
    if(this.scene) this.scene.destroy();
    if(this.interval) clearInterval(this.interval);
    this.slider.destroy();
    for(let child in this) delete this[child];
  }

}

const DistortionImages = {
  init: function() {
    this.objects = {};

    window.addEventListener('enter', ()=>{
      this.check(App.$container);
    })
    window.addEventListener('exit', ()=>{
      for(let index in this.objects) {
        document.removeEventListener('lazybeforeunveil', this.objects[index].finded);
        this.objects[index].scene.destroy();
        delete this.objects[index];
      }
    })
    
  },
  check: function($page) {
    $page.querySelectorAll('.js-distortion').forEach(($scene, index)=>{
      let $img = $scene.querySelector('img'), 
          texture = $img.getAttribute('data-src');
      $img.style.display='none';
  
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

const mobileWindow = {
  init: function() {
    let $el = document.createElement('div')
    $el.style.cssText = 'position:fixed;height:100%;';
    $body.insertAdjacentElement('beforeend', $el);
    this.h = $el.getBoundingClientRect().height;
    $el.remove();
    window.addEventListener('enter', ()=>{
      this.check();
    })
  }, 
  check: function() {
    let $el =  App.$container.querySelector('.home-screen');
    if($el) $el.style.height = `${this.h}px`;
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

  start(texture, index=0) {
    this.textures = [];
    this.texture = this.textures[index] = this.track(new THREE.TextureLoader().load(texture, ()=>{
      this.material.uniforms.img1.value = this.texture;
      this.material.uniforms.img2.value = this.texture;
      this.resize(this.texture);
      this.render();
      window.addEventListener('resize', this.resizeEvent);
      //callback
      if(this.started_callback) this.started_callback();
    }))
  }

  show(speed=Speed*1.5) {
    gsap.timeline()
      .fromTo([this.material.uniforms.progress1, this.material.uniforms.progress2], {value:1}, {value:0, duration:speed, ease:'power2.out'})
      .to(this.renderer.domElement, {autoAlpha:1, duration:speed, ease:'power2.inOut'}, `-=${speed}`)
      .eventCallback('onComplete', ()=>{
        if(this.showed_callback) this.showed_callback();
      })
  }

  change(texture, index, speed=Speed) {

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
    this.resTracker.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.scene.remove.apply(this.scene, this.scene.children);
    for(let child in this) delete this[child];
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

  start(texture, index=0) {
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

  show(speed=Speed*1.5) {
    gsap.timeline()
      .to(this.renderer.domElement, {autoAlpha:1, duration:speed, ease:'power1.inOut'}) 
      .fromTo(this.material.uniforms.waveLength, {value:this.wave_max}, {value:this.wave_min, duration:speed, ease:'power1.out'}, `-=${speed}`)
      .eventCallback('onComplete', ()=>{
        //callback
        if(this.showed_callback) this.showed_callback();
      })
  }

  change(texture, index, speed=Speed) {
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
    this.resTracker.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.scene.remove.apply(this.scene, this.scene.children);
    for(let child in this) delete this[child];
  }
}

class Map {
  constructor($parent) {
    this.$parent = $parent;
  }

  init() {
    this.$checkbox = this.$parent.querySelector('.select');
    this.$scontainer = this.$parent.querySelector('.contacts__select');
    this.$contents = this.$parent.querySelector('.contacts-block__contents');
    this.$contents__inner = this.$parent.querySelector('.contacts-block__contents-inner');
    this.$block = this.$parent.querySelector('.contacts-block');
    this.$map_container = this.$parent.querySelector('#map');
    this.apiKey = '4db33d7a-110f-4ffa-8835-327389c45d9d';
    this.$items = [];

    //map
    let mapCallback = function(){};

    let loadMap = ()=> {
      if(typeof ymaps === 'undefined') {
        let callback = ()=> {
          ymaps.ready(createMap);
        }
        let script = document.createElement("script");
        script.type = 'text/javascript';
        script.onload = callback;
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${this.apiKey}&lang=ru_RU`;
        $body.appendChild(script);
      } else {
        createMap();
      }
    }
    
    let createMap = ()=> {
      this.map = new ymaps.Map(this.$map_container, {
        center: [55.76, 37.64],
        controls: ['zoomControl'],
        zoom: 9
      });
      this.map.behaviors.disable(['scrollZoom', 'drag']);
      this.placemarks = [];
      this.$map = this.map.container._element;
      this.$map.classList.add('contacts__map-element');
      gsap.set(this.$map, {autoAlpha:0})
      mapCallback();
    }

    let setMapPoints = (data)=> {
      let points = {},
          center = [],
          p1 = [], p2 = [];

      for(let i in data) {
        let point = data[i].point;
        if(point) {
          points[i] = point;
          p1.push(point[0]);
          p2.push(point[1]);
        }
      }
      center[0] = p1.reduce((a, b) => a + b, 0)/p1.length;
      center[1] = p2.reduce((a, b) => a + b, 0)/p2.length;

      if(this.placemarks.length) {
        for(let placemark of this.placemarks) {
          this.map.geoObjects.remove(placemark);
        }
      } 


      let placemarks = [];
      for(let i in data) {
        if(points[i]) {
          let placemark = new ymaps.Placemark(points[i], {
            balloonContent: data[i].address
          }, 
          {
            iconLayout: 'default#image',
            iconImageHref: 'https://inpoolconcept.ru/themes/inpool/assets/build/img/icons/mappoint.svg',
            iconImageSize: [30, 30],
            iconImageOffset: [-15, -30],
            hideIconOnBalloonOpen: false
          });
          this.map.geoObjects.add(placemark);
          placemarks.push(placemark);
        }

        setTimeout(()=>{
          this.map.setCenter(center, 9, {duration: Speed*1000});
          this.placemarks = placemarks;
        }, 500)
      }
    }

    //data
    let getData = ()=> {
      return new Promise((resolve, reject)=>{
        if(dev) {
          let val = this.$checkbox.value,
              data;
          if(val=='Москва') {
            data = [{
              address: 'Новорижское шоссе, 27 км владение 1, Садовый центр "Балтия Гарден" "Центр Бассейнов"',
              name: 'Центр Бассейнов',
              phones: ['+79252656059', '+79252656059']
            },{
              address: '115419, Москва, ул.Шаболовка 34с БЦ Матрикс офис',
              email: 'info@waterelements.ru',
              name: 'Water Elements',
              phones: ['+79252656059'],
              site: 'https://waterelements.ru/'
            }]
          } else {
            data = [{
              address: '115419, Москва, ул.Шаболовка 34с БЦ Матрикс офис',
              name: 'Центр Бассейнов',
              phones: ['+79252656059', '+79252656059']
            }]
          }
          resolve(data)
        } 
        else {
          $(this.$checkbox).request('onSelect', {
            success: function(data) {
              resolve(data)
            }
          })
        }
      })
      .then((data)=>{
        return new Promise((resolve, reject)=>{
          let promises = [];
          data.forEach((place, index)=>{
            let address = place.address.replace(/ /g,"+");
            promises[index] = new Promise((resolve, reject)=>{
              httpGetAsync(`https://geocode-maps.yandex.ru/1.x/?apikey=${this.apiKey}&format=json&geocode=${address}`, (req)=>{
                let members = JSON.parse(req.response).response.GeoObjectCollection.featureMember;
                if(members.length) {
                  let pos = members[0].GeoObject.Point.pos.split(' ').reverse(),
                      array = [];
                  for(let i in pos) {
                    array[i] = parseFloat(pos[i]);
                  }
                  place.point = array;
                }
                resolve();
              })
            })
          })
          Promise.all(promises).then(()=>{
            resolve(data);
          });
        })  
      })
    }

    //html
    let deleteInfo = ()=> {
      gsap.to(this.$contents, {css:{'height':'0px'}, duration:Speed/2, ease:'power2.inOut', onComplete:()=>{
        this.$contents.style.height = 'auto';
      }})
      if(this.$items.length) {
        for(let $item of this.$items) {
          gsap.to($item, {autoAlpha:0, duration:Speed/2, ease:'power2.inOut', onComplete:()=>{
            $item.remove();
          }})
        }
        this.$items = [];
      }
    }
    let createInfo = (data)=> {
      this.$contents.style.height = '0px';

      for(let index in data) {
        let item = data[index];
        let $block = document.createElement('div'),
            $left = document.createElement('div'),
            $right = document.createElement('div');
        $block.classList.add('contacts-block__content');
        $left.classList.add('contacts-block__content-left');
        $right.classList.add('contacts-block__content-right');
        $block.insertAdjacentElement('afterbegin', $left);
        $block.insertAdjacentElement('beforeend', $right);

        //name
        for(let key in item) {
          if(key=='name') {
            let $item = `<div class="contacts-block__item">${item[key]}</div>`
            $left.insertAdjacentHTML('afterbegin', $item);
          }
        }
        //address
        for(let key in item) {
          if(key=='address') {
            let $item = `<div class="contacts-block__item">${item[key]}</div>`
            $left.insertAdjacentHTML('beforeend', $item);
          }
        }
        //site
        for(let key in item) {
          if(key=='site') {
            let $item = 
              `<div class="contacts-block__item"> 
                <a href="${item[key]}" rel="noopener" target="_blank">${cleanUp(item[key])}</a>
              </div>`
            $right.insertAdjacentHTML('afterbegin', $item);
          }
        }
        //email
        for(let key in item) {
          if(key=='email') {
            let $item = 
              `<div class="contacts-block__item"> 
                <a href="mailto:${item[key]}">${item[key]}</a>
              </div>`
            $right.insertAdjacentHTML('beforeend', $item);
          }
        }
        //phones
        for(let key in item) {
          if(key=='phones') {
            for(let phone of item[key]) {
              let re = /(?:([\d]{1,}?))??(?:([\d]{1,3}?))??(?:([\d]{1,3}?))??(?:([\d]{2}))??([\d]{2})$/;
              let fp = phone.replace( re, function( all, a, b, c, d, e ){
                return ( a ? a + " " : "" ) + ( b ? b + " " : "" ) + ( c ? c + "-" : "" ) + ( d ? d + "-" : "" ) + e;
              });
              let $item = 
                `<div class="contacts-block__item"> 
                  <a href="tel:${phone}">${fp}</a>
                </div>`
              $right.insertAdjacentHTML('beforeend', $item);
            }
          }
        }

        this.$items[index] = $block;
        this.$contents__inner.insertAdjacentElement('beforeend', $block);
      }


      let height = this.$contents__inner.getBoundingClientRect().height;
      gsap.to(this.$contents, {css:{'height':`${height}px`}, duration:Speed/2, ease:'power2.inOut', onComplete:()=>{
        this.$contents.style.height = 'auto';
      }})
      gsap.to(this.$items, {autoAlpha:1, duration:Speed/2, ease:'power2.inOut'})
    }

    let changeEvents = (data)=> {
      let animation = gsap.timeline({paused:true})
        .to(this.$map, {autoAlpha:1, duration:Speed/2, ease:'power2.inOut'})
      
      setTimeout(()=>{
        createInfo(data);
        animation.play();
        this.inAnimation = false;
        this.$block.classList.remove('disabled');
      }, Speed*1000)
      
      setMapPoints(data);
    }

    let change = ()=> {
      this.$block.classList.add('disabled');
      this.inAnimation = true;
      let Data, promises = [];
      promises[0] = new Promise((resolve, reject)=>{
        if(!this.initialized) {
          this.initialized = true;
          resolve();
        } else {
          deleteInfo();
          gsap.to(this.$map, {autoAlpha:0, duration:Speed/2, ease:'power2.inOut', onComplete:()=>{
            resolve();
          }})
        }
      })
      promises[1] = new Promise((resolve, reject)=>{
        getData().then((data)=>{
          Data = data;
          if(this.map) resolve();
          else mapCallback = ()=> {resolve()};
        })
      })
      Promise.all(promises).then(()=>{
        changeEvents(Data);
      });
    }

    loadMap();
    change();
    this.$checkbox.addEventListener('change', ()=>{
      if(!this.inAnimation) change();
    });
  }

  destroy() {
    for(let child in this) delete this[child];
  }
}



