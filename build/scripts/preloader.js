"use strict";

var $prelaoder = document.querySelector('.preloader'),
    $images = $prelaoder.querySelectorAll('img'),
    $chars = $prelaoder.querySelectorAll('.preloader__char'),
    $square = $prelaoder.querySelectorAll('.preloader__square'),
    timer,
    loading_duration = 0,
    loaded_images_count = 0,
    loaded_images_flag;
timer = setInterval(function () {
  loading_duration += 100;

  if (loaded_images_count == $images.length && !loaded_images_flag) {
    loaded_images_flag = true;
    $prelaoder.classList.add('active');
    setTimeout(function () {
      $images.forEach(function ($image) {
        $image.classList.add('active');
      });
      $chars.forEach(function ($char) {
        setTimeout(function () {
          $char.classList.add('active');
        }, 500 * Math.random());
      });
    }, 250);
  }
}, 100);
$images.forEach(function ($image) {
  $image.onload = function () {
    loaded_images_count++;
  };

  $image.onerror = function () {
    loaded_images_count++;
  };

  $image.setAttribute('src', $image.getAttribute('data-src'));
});
//# sourceMappingURL=maps/preloader.js.map
