var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    xlsx = require('node-xlsx'),
    models = require('../models'); // https://github.com/mgcrea/node-xlsx

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('indexView', { title: '七玥天使' });
});

/*
* Get seat map of a classroom
* 获取一个教室的座位图
* */
router.get('/seatmap', function(req, res, next) {
  res.render('seatMapView',{ title: '七玥天使-教室座位图' });
});

/*
* Get buildings of a school
* 获取教学楼列表
* */
router.get('/building', function(req, res, next){
  models.buildingModel.getAll(1, function(err, areas){
    if(err){
      res.render('errorView', {title:'服务器故障，请稍后再试'});
    }
    else{
      res.render('buildingView', {title:'七玥天使-自习室导航', areas: areas});
    }
  });
});

router.get('/loadcourse', function(req, res, next){
    var dataFromFile = xlsx.parse('./bak/data.xlsx');
    var data = dataFromFile[0]['data'];
    var msg = '执行完毕';

    async.forEachSeries(data, function(item, callback){
        var courseInfo = {
            'course_name':item[0],
            'course_xkkh':item[3],
            'teacher_name':item[2],
            'teacher_code':item[1]
        }
        models.parseModel.addCourse(courseInfo, callback);
    },function(err){
        msg = err;
    });
    res.render('parseView', {title:'解析数据', msg:msg});
});

// 0 课程名
// 1 教工号
// 2 教师姓名
// 3 选课课号
// 4 教室类型 多媒体 普通教室 操场 电工实验室 电机实验室 .....
// 5 上课时间
// 6 上课地点

router.get('/loadbuilding', function(req, res, next){
    var dataFromFile = xlsx.parse('./bak/data.xlsx');
    var datas = dataFromFile[0]['data'];
    var msg;

    async.eachSeries(datas, function(item, callback){
        console.log(item);
        models.parseModel.parseBuildingArea(item, callback);
    }, function(err){
        msg = err;
        console.log(err);
    });

    res.render('parseView', {title:'加载教学楼信息', msg:msg});
});


router.get('/loadclassroom', function(req, res, next){
    var dataFromFile = xlsx.parse('./bak/data.xlsx');
    var datas = dataFromFile[0]['data'];
    var msg;

    async.eachSeries(datas, function(item, callback){
        console.log(item);
        models.parseModel.parseClassRoom(item, callback);
    }, function(err){
        msg = err;
        console.log(err);
    });

    res.render('parseView', {title:'加载教室信息', msg:msg});
});

router.get('/loadclasstime', function(req, res, next){
    var dataFromFile = xlsx.parse('./bak/data.xlsx');
    var datas = dataFromFile[0]['data'];
    var msg;
    async.eachSeries(datas, function(item, callback){
        //console.log(item);
        models.parseModel.parseClassTime(item, callback);
    },
    function(err){
        msg = err;
        console.log(err);
    });
    res.render('parseView', {title:'加载教室信息', msg:msg});
});

module.exports = router;
