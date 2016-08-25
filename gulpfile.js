// var _ = require('lodash')
var argv = require('argv')
var gulp = require('gulp')
var babel = require('gulp-babel')
var eslint = require('gulp-eslint')
// var gulpCount = require('gulp-count')
// var gulpInstall = require('gulp-install')
var gutil = require('gulp-util')
var colors = gutil.colors
var del = require('del')
// var sourcemaps = require('gulp-sourcemaps')
// var spawn = require('child_process').spawn
// var gls = require('gulp-live-server')
var runSequence = require('run-sequence')
var mocha = require('gulp-spawn-mocha')
var changed = require('gulp-changed')

var args = argv
  .option({
    name: 'test-only',
    short: 't',
    type: 'string',
    description: 'Only run tests containing this string',
    example: "'gulp test --test-only=foo'"
  })
  .option({
    name: 'dry-run',
    type: 'boolean',
    description: 'Dry run deploy flag',
    example: "'gulp deploy --dry-run=false'"
  })
  .run()

// COMMANDS
  // * These are the tasks you should call directly
  // * Dependencies only (no implementation; no runSequence)
  // * These are effectively aliases

gulp.task('clean', ['clean:all'])

gulp.task('nuke', ['nuke:all'])

gulp.task('build', ['build:all'])

gulp.task('test', ['test-unit:all'])

gulp.task('start', ['start:server'])

gulp.task('watch', ['watch:all'])

gulp.task('deploy', ['deploy:lambdas'])

// DEPENDENCIES
// * Defines the dependency chains
// * Dependencies can only exist between tasks in this area
// * Typically calls runSequence to :run versions of tasks
// * runSequence should *only* have calls to :run versions
// * You should never call these tasks directly

/* CLEAN */
gulp.task('clean:all', (done) => {
  runSequence('clean:lib:run', done)
})

gulp.task('nuke:all', ['clean:all'], (done) => {
  runSequence('clean-npm:lib:run', done)
})

/* INSTALL */

/* BUILD */

gulp.task('build:all', ['build:lib'])

gulp.task('build:lib', (done) => {
  runSequence('build:lib:run', done)
})

/* TEST */

gulp.task('test-unit:all', ['build:all'], (done) => {
  runSequence('test-unit:lib:run', 'lint:all:run', done)
})

/* LINT */
gulp.task('lint:all', ['build:all', 'test-unit:all'], (done) => {
  runSequence('lint:all:run', done)
})

/* RUN */

/* DEPLOY */

// LOGIC ONLY
// * No dependencies allowed
// * No runSequence calls allowed
// * You should never call these tasks directly

/* CLEAN */
gulp.task('clean:lib:run', () => {
  return del('dist')
})

gulp.task('clean-npm:lib:run', () => {
  var targets = [
    'node_modules'
  ]

  return del(targets)
})

/* INSTALL */

/* BUILD */

gulp.task('build:lib:run', () => {
  var src = 'lib/**/*.js'
  var dst = 'dist'
  return gulp
    .src(src)
    .pipe(changed(dst))
    // .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['es2015']
    }))
    // .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dst))
})

/* TEST */

gulp.task('test-unit:lib:run', () => {
  var mochaOptions = {
    cwd: 'dist'
    // opts: 'mocha.opts'
  }

  if (args.options['test-only']) {
    gutil.log(
      colors.cyan('test-unit:lib:run') + ':',
      colors.yellow('Only running tests matching'),
      colors.magenta(args.options['test-only']))

    mochaOptions.grep = args.options['test-only']
  }

  return gulp
    .src('dist/**/*.spec.js', { read: false })
    .pipe(mocha(mochaOptions))
})

/* LINT */

gulp.task('lint:all:run', () => {
  var sources = [
    'gulpfile.js',
    'lib/**/*.js'
  ]

  return gulp
    .src(sources)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
})

/* START/WATCH */

/* DEPLOY */
