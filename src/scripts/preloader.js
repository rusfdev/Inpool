let $prelaoder = document.querySelector('.preloader'),
    $chars = $prelaoder.querySelectorAll('.preloader__char'),
    $square = $prelaoder.querySelector('.preloader__square'),
    timer, lgth=0,
    loading_duration = 0;


timer = setInterval(() => {
  loading_duration+=100;
}, 100);
$prelaoder.classList.add('active');
for(let $char of $chars) {
  if(window.getComputedStyle($char).display!=='none') lgth++;
}
$chars.forEach(($char, index)=>{
  setTimeout(() => {
    $char.classList.add('active');
  }, 100 + ((lgth*50)*Math.random()));
})
setTimeout(() => {
  $square.classList.add('active');
}, 500);

window.onload = function(){
  clearInterval(timer)
}