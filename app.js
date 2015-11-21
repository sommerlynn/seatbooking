var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var routes = require('./routes/index');
var users = require('./routes/users');
//var weixin = require('./routes/weixin');
var webot = require('weixin-robot');
var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
//app.use(bodyParser.json()); 腾讯发来的消息是xml格式，非json格式
app.use(bodyParser.urlencoded({ extended: true}));


// 载入webot1的回复规则
require('./rules')(webot);
// 启动机器人, 接管 web 服务请求
webot.watch(app, { token: '1qazxsw2', path: '/weixin' });


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.query());
// 如果需要 session 支持，sessionStore 必须放在 watch 之后
app.use(cookieParser());
// 为了使用 waitRule 功能，需要增加 session 支持
// https://github.com/expressjs/session
app.use(session({
  secret: 'hongqingting',
  resave: false,
  saveUninitialized: true
}));

app.use('/', routes);
app.use('/users', users);
//app.use('/weixin', weixin);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
