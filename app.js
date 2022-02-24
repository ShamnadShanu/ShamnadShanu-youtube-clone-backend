var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var db=require('./config/mongodb')
var fileUpload=require('express-fileupload')
const cors=require('cors')
const dotenv= require('dotenv').config()
var adminRouter = require('./routes/admin');
var userRouter = require('./routes/user');

var app = express();
// view engine setup
// app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(cors({
  origin:['http://localhost:3000','https://youtube-clone-sepia-xi.vercel.app'],
  methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH'],
  allowedHeaders: ['Content-Type','Origin']
}))
db.connect((err)=>{
  console.log('connected successfully');
  })
app.use('/admin',adminRouter)
app.use('/', userRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
