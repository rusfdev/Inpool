var gulp = require("gulp"),
    browsersync = require("browser-sync").create(),
    autoprefixer = require("gulp-autoprefixer"),
    pug = require('gulp-pug'),
    babel = require('gulp-babel'),
    sass = require("gulp-sass"),
    mincss = require("gulp-clean-css"),
    sourcemaps = require("gulp-sourcemaps"),
    rename = require("gulp-rename"),
    favicons = require("gulp-favicons"),
    newer = require("gulp-newer"),
    replace = require("gulp-replace"),
    watch = require("gulp-watch"),
    clean = require("gulp-clean"),
    uglify = require("gulp-uglify"),
    rsync = require('gulp-rsync'),
    imagemin = require('gulp-imagemin'),
    webpack = require('webpack'),
    webpackStream = require('webpack-stream');


let $images = ["./src/img/**/*.{jpg,jpeg,png,gif}", "!./src/img/favicons/*.{jpg,jpeg,png,gif}"],
    $images_watch = $images,

    $pug = ["./src/views/**/*.pug", "!./src/views/blocks/*.pug", "!./src/views/layout/*.pug"],
    $pug_watch = "./src/views/**/*.pug",

    $scripts = ["./src/scripts/**/*.js", "!./src/scripts/webpack/**/*"],
    $scripts_watch = $scripts,
    $webpack_scripts = "./src/scripts/webpack/**/*.js",
    $webpack_scripts_watch = "./src/scripts/webpack/**/*",

    $styles = ["./src/styles/**/*.scss", "!./src/styles/components/**/*.scss"],
    $styles_watch = "./src/styles/**/*.scss",

    $favicons = "./src/img/favicons/*.{jpg,jpeg,png,gif}"

    $other = ["./src/**/*", "!./src/img/**/*.{jpg,jpeg,png,gif}", "!./src/img/favicons/*.{jpg,jpeg,png,gif}", "!./src/scripts/**/*", "!./src/styles/**/*", "!./src/views", "!./src/views/**/*", "!./src/locales", "!./src/locales/**/*"];


gulp.task("pug", function () {
  return gulp.src($pug)
    .pipe(pug({pretty:true}))
    .pipe(gulp.dest("./build/"))
    .on("end", browsersync.reload);
});
gulp.task("pug_production", function () {
  return gulp.src($pug)
    .pipe(pug({pretty:true}))
    .pipe(replace('.css', '.min.css'))
    .pipe(replace('.js', '.min.js'))
    .pipe(gulp.dest("./build/"))
    .on("end", browsersync.reload);
});

gulp.task("scripts", function () {
  return gulp.src($scripts)
    .pipe(sourcemaps.init())
    .pipe(babel({presets: ["@babel/preset-env"]}))
    .pipe(sourcemaps.write("./maps/"))
    .pipe(gulp.dest("./build/scripts/"))
    .on("end", browsersync.reload);
});
gulp.task("scripts_production", function () {
  return gulp.src($scripts)
    .pipe(babel({presets: ["@babel/preset-env"]}))
    .pipe(uglify())
    .pipe(rename({suffix: ".min"}))
    .pipe(gulp.dest("./build/scripts/"))
});
gulp.task("webpack_scripts", function () {
  return gulp.src($webpack_scripts)
    .pipe(webpackStream({
      mode: 'development',
      output: {
        filename: 'common.js',
      },
      performance: {
        hints: false,
        maxEntrypointSize: 1000,
        maxAssetSize: 1000
      },
      module: {
        rules: [{
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            presets: ["@babel/preset-env", {'plugins': ['@babel/plugin-proposal-class-properties']}]
          }
        }]
      },
      module: {
        rules: [{
          test: /\.(frag|vert|glsl)$/,
          use: [
            { 
              loader: 'glsl-shader-loader',
              options: {}  
            }
          ]
        }]
      }
    }))
    .pipe(gulp.dest("./build/scripts/"))
    .on("end", browsersync.reload);
});
gulp.task("webpack_scripts_production", function () {
  return gulp.src($webpack_scripts)
    .pipe(webpackStream({
      mode: 'production',
      output: {
        filename: 'common.min.js',
      },
      performance: {
        hints: false,
        maxEntrypointSize: 1000,
        maxAssetSize: 1000
      },
      module: {
        rules: [{
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            presets: ["@babel/preset-env", {'plugins': ['@babel/plugin-proposal-class-properties']}]
          }
        }]
      },
      module: {
        rules: [{
          test: /\.(frag|vert|glsl)$/,
          use: [
            { 
              loader: 'glsl-shader-loader',
              options: {}  
            }
          ]
        }]
      }
    }))
    .pipe(gulp.dest("./build/scripts/"))
});

gulp.task("styles", function() {
  return gulp.src($styles)
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(sourcemaps.write("./maps/"))
    .pipe(gulp.dest("./build/styles/"))
    .on("end", browsersync.reload);
});
gulp.task("styles_production", function() {
  return gulp.src($styles)
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(mincss({level:{1:{specialComments:'none'},2:{}}}))
    .pipe(rename({suffix: ".min"}))
    .pipe(gulp.dest("./build/styles/"))
});

gulp.task("images", function () {
  return gulp.src($images)
    .pipe(newer("./build/img/"))
    .pipe(gulp.dest("./build/img/"))
    .on("end", browsersync.reload);
});
gulp.task("images_production", function () {
  return gulp.src($images)
    .pipe(newer("./build/img/"))
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.mozjpeg({quality: 80, progressive: true}),
      imagemin.optipng({optimizationLevel: 5})
    ]))
    .pipe(gulp.dest("./build/img/"))
});

gulp.task("favicons", function () {
  return gulp.src($favicons)
    .pipe(favicons({
      icons: {
        appleIcon: true,
        favicons: true,
        online: false,
        appleStartup: false,
        android: false,
        firefox: false,
        yandex: false,
        windows: false,
        coast: false
      }
    }))
    .pipe(gulp.dest("./build/img/favicons/"))
});

gulp.task("other", function () {
  return gulp.src($other)
    .pipe(gulp.dest("./build/"))
    .on("end", browsersync.reload);
});

gulp.task("clean", function () {
  return gulp.src("./build/*", {
      read: false
    })
    .pipe(clean())
});

gulp.task("serve", function () {
  return new Promise((res, rej) => {
    browsersync.init({
      server: "./build/",
      tunnel: false,
      port: 9000
    });
    res();
  });
});

gulp.task("watch", function () {
  return new Promise((res, rej) => {
    watch($pug_watch, gulp.series("pug"));

    watch($styles_watch, gulp.series("styles"));

    watch($scripts_watch, gulp.series("scripts"));
    watch($webpack_scripts_watch, gulp.series("webpack_scripts"));

    watch($images_watch, gulp.series("images"));

    watch($favicons, gulp.series("favicons"));

    watch($other, gulp.series("other"));
    res();
  });
});

gulp.task("default", 
  gulp.series(
    "clean",
    gulp.parallel("pug", "styles", "scripts", "webpack_scripts", "images", "favicons", "other"),
    gulp.parallel("watch", "serve")
  )
);

gulp.task("production", 
  gulp.series(
    "clean",
    gulp.parallel("pug_production", "styles_production", "scripts_production", "webpack_scripts_production", "favicons", "other"),
    "images_production"
  )
);

gulp.task("transfer", function () {
  return gulp.src('./build/**')
    .pipe(rsync({
      root: './build/',
      hostname: 'user@00.000.000.000',
      destination: 'www/domain.com/',
      archive: true,
      silent: false,
      chmod : "Du=rwx,Dgo=rx,Fu=rw,Fog=r" 
    }));
});