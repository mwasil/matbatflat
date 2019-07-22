// Sass configuration
'use strict';
var gulp = require('gulp');
var sass = require('gulp-sass');
var sassGlob = require('gulp-sass-glob');
var rename = require("gulp-rename");
let minifyCss = require('gulp-clean-css');


//compile 

gulp.task('sass', function (done) {
    gulp.src('sass/materialize.scss') 
        .pipe(sassGlob())
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('css'))
        .pipe(minifyCss())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('css'));
        //TO DO: minification
	done();
});

gulp.task('default', gulp.parallel('sass'));

gulp.task('watch', function () {
    return gulp.watch('sass/**/*.scss', gulp.series('default'));
});