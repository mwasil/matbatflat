// Sass configuration
'use strict';
var gulp = require('gulp');
var sass = require('gulp-sass');
var sassGlob = require('gulp-sass-glob');


//compile 

gulp.task('sass', function (done) {
    gulp.src('sass/materialize.scss') 
        .pipe(sassGlob())
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('css')); 
        //TO DO: minification
	done();
});

gulp.task('default', gulp.parallel('sass'));