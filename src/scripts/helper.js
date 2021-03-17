window.addEventListener('load', ()=>{
  Helper.init();
})

const Helper = {
  init: function() {
    this.$block = document.querySelector('.helper');
    this.$trigger = this.$block.querySelector('.helper__trigger');

    this.set_active_page();
    window.addEventListener('enter', ()=>{this.set_active_page();});

    this.$trigger.addEventListener('click', ()=>{
      if(!this.state) {
        this.open();
      } else {
        this.close();
      }
    })

  },
  set_active_page: function() {
    let values = location.href.split('/'),
        last_value = values[values.length-1],
        page = last_value=='' ? 'index.html': last_value;

    let $links = this.$block.querySelectorAll('a');
    
    $links.forEach(($this)=>{
      let href_values = $this.getAttribute('href').split('/'),
          href_page = href_values[href_values.length-1];
      if(page==href_page) {
        $this.classList.add('active');
      } else {
        $this.classList.remove('active');
      }
    })
  },
  open: function() {
    this.state = true;
    this.$block.classList.add('active');
  },
  close: function() {
    this.state = false;
    this.$block.classList.remove('active');
  }
}

