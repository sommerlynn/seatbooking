/**
 * Created by Administrator on 2016/4/12.
 */


/**/

router.get('/loadcourse', function (req, res, next) {
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

router.get('/loadbuilding', function (req, res, next) {
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


router.get('/loadclassroom', function (req, res, next) {
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

router.get('/loadclasstime', function (req, res, next) {
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
router.get('/fillSeatMap', function (req, res, next) {
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
