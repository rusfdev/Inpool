"use strict";

var $prelaoder = document.querySelector('.preloader'),
    $chars = $prelaoder.querySelectorAll('.preloader__char'),
    $square = $prelaoder.querySelector('.preloader__square'),
    timer,
    loading_duration = 0;
timer = setInterval(function () {
  loading_duration += 100;
}, 100);
$prelaoder.classList.add('active');
$chars.forEach(function ($char, index) {
  setTimeout(function () {
    $char.classList.add('active');
  }, 500 * Math.random());
});
setTimeout(function () {
  $square.classList.add('active');
}, 500);

window.onload = function () {
  clearInterval(timer);
};
//# sourceMappingURL=maps/preloader.js.map
