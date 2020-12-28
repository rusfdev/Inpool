let $prelaoder = document.querySelector('.preloader'),
    $chars = $prelaoder.querySelectorAll('.preloader__char'),
    $square = $prelaoder.querySelector('.preloader__square'),
    timer,
    loading_duration = 0;


timer = setInterval(() => {
  loading_duration+=100;
}, 100);
$prelaoder.classList.add('active');
$chars.forEach(($char, index)=>{
  setTimeout(() => {
    $char.classList.add('active');
  }, 100 + (1000*Math.random()));
})
setTimeout(() => {
  $square.classList.add('active');
}, 500);

window.onload = function(){
  clearInterval(timer)
}