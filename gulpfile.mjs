import autoprefixer from 'autoprefixer'
import concat from 'gulp-concat'
import csso from 'gulp-csso'
import { deleteAsync } from 'del'
import gulp from 'gulp'
import gulpWebp from 'gulp-webp'
import imagemin, { mozjpeg, optipng, svgo } from 'gulp-imagemin'
import order from 'gulp-order'
import plumber from 'gulp-plumber'
import postcss from 'gulp-postcss'
import pug from 'gulp-pug'
import rename from 'gulp-rename'
import uglify from 'gulp-uglify-es'
import dartSass from 'sass'
import gulpSass from 'gulp-sass'
import sourcemap from 'gulp-sourcemaps'
import svgstore from 'gulp-svgstore'
import sync from 'browser-sync'

const clean = async () => {
  return await deleteAsync(['dist'])
}

const copy = () => {
  return gulp
    .src(['src/fonts/**/*.{woff,woff2}', 'src/favicon/**/*'], { base: 'src' })
    .pipe(gulp.dest('dist'))
}

const css = () => {
  const sass = gulpSass(dartSass)
  return gulp
    .src('src/scss/index.scss')
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(postcss([autoprefixer({ remove: false })]))
    .pipe(rename('style.css'))
    .pipe(sourcemap.write('.'))
    .pipe(gulp.dest('dist/css'))
    .pipe(sync.stream())
    .pipe(csso())
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('dist/css'))
}

const images = () => {
  return gulp
    .src('src/img/*.{png,jpg,jpeg,svg}')
    .pipe(
      imagemin(
        [
          optipng({ optimizationLevel: 3 }),
          mozjpeg({ progressive: true }),
          svgo({
            plugins: [{ name: 'removeUnknownsAndDefaults', active: false }]
          })
        ],
        { silent: true }
      )
    )
    .pipe(gulp.dest('dist/img'))
}

const webp = () => {
  return gulp
    .src('src/img/*.{png,jpg.jpeg}')
    .pipe(gulpWebp({ quality: 80 }))
    .pipe(gulp.dest('dist/img'))
}

const sprite = () => {
  return gulp
    .src('src/img/icon-*.svg')
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename(`sprite.svg`))
    .pipe(gulp.dest('dist/img'))
}

const js = () => {
  return gulp
    .src('src/js/*.js')
    .pipe(order(['utils.js', '*.js']))
    .pipe(concat(`script.js`))
    .pipe(gulp.dest('dist/js'))
    .pipe(uglify.default())
    .pipe(rename(`script.min.js`))
    .pipe(gulp.dest('dist/js'))
}

const html = () => {
  return gulp
    .src('src/pug/pages/*.pug')
    .pipe(pug({ pretty: true }))
    .pipe(gulp.dest('dist'))
}

const refresh = (done) => {
  sync.reload()
  done()
}

const server = () => {
  sync.init({
    server: 'dist/',
    notify: false,
    open: false,
    cors: true,
    ui: false
  })

  gulp.watch('src/pug/**/*.{pug,js}', gulp.series(html, refresh))
  gulp.watch('src/fonts/**/*.{woff,woff2}', gulp.series(copy, html, refresh))
  gulp.watch('src/img/icon-*.svg', gulp.series(sprite, html, refresh))
  gulp.watch('src/scss/**/*.scss', gulp.series(css))
  gulp.watch('src/js/**/*.js', gulp.series(js, refresh))
}

export const build = gulp.series(
  clean,
  copy,
  css,
  js,
  images,
  webp,
  sprite,
  html
)

export const dev = gulp.series(build, server)
