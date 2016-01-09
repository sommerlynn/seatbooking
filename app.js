var express = require('express');
var app = express();
var path = require('path');
//var favicon = require('serve-favicon');

var logger = require('morgan');
var debug = require('debug');
var log = debug("seatbooking::log");
var error = debug("seatbooking::error");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

var weixinrobot = require('./lib/weixin-robot');
//require('./lib/weixin-robot/rules')(weixinrobot);
require('./rules')(weixinrobot);
weixinrobot.watch(app, { token: '1qazxsw2', path: '/weixin' });



app.use(express.static(path.join(__dirname, 'public')));
app.use(express.query());


var cookieParser = require('cookie-parser');
app.use(cookieParser());

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

// https://github.com/expressjs/session
//var session = require('express-session');
//app.use(session({
// secret: 'hongqingting',
//  resave: false,
//  saveUninitialized: true
//}));


var index = require('./routes/index');
app.use('/', index);

// catch 404 and forward to error handler
/*app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});*/


// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    log(err);
    res.status(err.status || 500);
    res.render('errorView', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stack traces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('errorView', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
