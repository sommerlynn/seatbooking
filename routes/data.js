/**
 * Created by Administrator on 2016/4/12.
 */
var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    xlsx = require('node-xlsx'), // https://github.com/mgcrea/node-xlsx
    models = require('../models'),
    OAuth = require('wechat-oauth'),
    WeiJSAPI = require('../lib/weixin-jssdk'),
    debug = require('debug'),
    log = debug('seat'),
    support = debug('../lib/support');

/**/

router.get('/data/loadcourse', function (req, res, next) {
    var dataFromFile = xlsx.parse('./bak/data.xlsx');
    var data = dataFromFile[0]['data'];
    var msg = '执行完毕';

    async.forEachSeries(data, function (item, callback) {
        var courseInfo = {
            'course_name': item[0],
            'course_xkkh': item[3],
            'teacher_name': item[2],
            'teacher_code': item[1]
        }
        models.parseModel.addCourse(courseInfo, callback);
    }, function (err) {
        msg = err;
    });
    res.render('parseView', {title: '解析数据', msg: msg});
});

// 0 课程名
// 1 教工号
// 2 教师姓名
// 3 选课课号
// 4 教室类型 多媒体 普通教室 操场 电工实验室 电机实验室 .....
// 5 上课时间
// 6 上课地点

router.get('/data/loadbuilding', function (req, res, next) {
    var dataFromFile = xlsx.parse('./bak/data.xlsx');
    var datas = dataFromFile[0]['data'];
    var msg;

    async.eachSeries(datas, function (item, callback) {
        console.log(item);
        models.parseModel.parseBuildingArea(item, callback);
    }, function (err) {
        msg = err;
        console.log(err);
    });

    res.render('parseView', {title: '加载教学楼信息', msg: msg});
});


router.get('/data/loadclassroom', function (req, res, next) {
    var dataFromFile = xlsx.parse('./bak/data.xlsx');
    var datas = dataFromFile[0]['data'];
    var msg;

    async.eachSeries(datas, function (item, callback) {
        console.log(item);
        models.parseModel.parseClassRoom(item, callback);
    }, function (err) {
        msg = err;
        console.log(err);
    });

    res.render('parseView', {title: '加载教室信息', msg: msg});
});

router.get('/data/loadclasstime', function (req, res, next) {
    var dataFromFile = xlsx.parse('./bak/data.xlsx');
    var datas = dataFromFile[0]['data'];
    var msg;
    async.eachSeries(datas, function (item, callback) {
            //console.log(item);
            models.parseModel.parseClassTime(item, callback);
        },
        function (err) {
            msg = err;
            console.log(err);
        });
    res.render('parseView', {title: '加载教室信息', msg: msg});
});

/*根据行、列数计算教室的默认标准地图数据*/
router.get('/data/fillSeatMap', function (req, res, next) {
    models.classroomModel.getAll(1, function (err, classrooms) {
        if (err) {

        } else {
            async.eachSeries(classrooms, function (item, callback) {
                    console.log(item.classroom_name);
                    models.classroomModel.buildSeatMap(item, callback);
                },
                function (err) {
                    msg = err;
                    console.log(err);
                });
        }
    });

});

router.get('/data/building/:schoolId', function (req, res) {
    models.classroomModel.getAll(req.params.schoolId, function (err, classroomList) {
        res.render('./data/buildingView',
            {
                title: '七玥天使-自习室导航',
                classroomList: classroomList
            });
    });
});

router.get('/data/buildingClassroom/:areaId', function (req, res) {
    models.classroomModel.getByAreaID(req.params.areaId, function (err, classroomList) {
        res.render('./data/buildingClassroomView',
            {
                title: '七玥校园',
                classroomList: classroomList
            });
    });
});

router.get('/data/classroom/:cid', function (req, res) {
    res.render('./data/classroomView',
        {
            title: '七玥校园'
        });
});
