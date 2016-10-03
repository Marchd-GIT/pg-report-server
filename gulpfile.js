var gulp = require('gulp');
var rigger = require('gulp-rigger');
 
gulp.task('default', function () {
    gulp.src('scripts/source/app.jsx')
        .pipe(rigger())
        .pipe(gulp.dest('scripts/build/'));
});
