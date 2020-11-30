let $prelaoder = document.querySelector('.preloader'),
    $images = $prelaoder.querySelectorAll('img'),
    $chars = $prelaoder.querySelectorAll('.preloader__char'),
    $square = $prelaoder.querySelector('.preloader__square'),
    timer,
    loading_duration = 0,
    loaded_images_count = 0,
    loaded_images_flag;


/* timer = setInterval(() => {
  loading_duration+=100;

  if(loaded_images_count==$images.length && !loaded_images_flag) {
    loaded_images_flag = true;
    $prelaoder.classList.add('active');
    setTimeout(() => {
      $images.forEach(($image)=>{
        $image.classList.add('active');
      })
      $chars.forEach(($char)=>{
        setTimeout(() => {
          $char.classList.add('active');
        }, 500*Math.random());
      })
    }, 250);
  }

}, 100); */

$prelaoder.classList.add('active');
$chars.forEach(($char, index)=>{
  setTimeout(() => {
    $char.classList.add('active');
  }, 500*Math.random());
})
setTimeout(() => {
  $square.classList.add('active');
}, 500);

/* $images.forEach(($image)=>{
  $image.onload = ()=> {loaded_images_count++;}
  $image.onerror = ()=> {loaded_images_count++;}
  $image.setAttribute('src', $image.getAttribute('data-src'));
}) */
