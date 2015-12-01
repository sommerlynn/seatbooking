var express = require('express'),
    router = express.Router(),
    models = require('../models/buildings');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: '七月天使' });
});

/*
* Get seat map of a classroom
* 获取一个教室的座位图
* */
router.get('/seatmap', function(req, res, next) {
  res.render('seatmap',{ title: '七玥天使-教室座位图' });
});

/*
* Get buildings of a school
* 获取教学楼列表
* */
router.get('/building', function(req, res, next){
  models.getAll(1, function(err, areas){
    if(err){
      res.render('error', {title:'服务器故障，请稍后再试'});
    }
    else{
      res.render('building', {title:'七玥天使-华电校园自习室', areas: areas});
    }
  });
});

module.exports = router;
