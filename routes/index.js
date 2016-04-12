var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    xlsx = require('node-xlsx'), // https://github.com/mgcrea/node-xlsx
    models = require('../models'),
    OAuth = require('wechat-oauth');

/* GET home page. */
router.get('/', function (req, res) {
    res.render('indexView', {title: '七玥星空'});
});

router.get('/index', function (req, res) {
    res.render('indexView', {title: '七玥星空'});
});

/************************************************************************用户信息*/

/*
 * 获取用户信息
 * 2016-04-12 CHEN PU 获取用户信息 第一步
 * */
router.get('/oAuth/:from', function (req, res) {
    var client = new OAuth('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
    var url = client.getAuthorizeURL('http://www.julyangel.cn/oAuthGetInfo/' + req.params.from, '123', 'snsapi_userinfo');
    res.redirect(url);
});

/*
 * 获取用户信息 CHEN PU 获取用户信息 第二步
 * */
router.get('/oAuthGetInfo/:from', function (req, res) {
    var client = new OAuth('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
    client.getAccessToken(req.query.code, function (err, result) {
        if (err) {
            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
        }
        else {
            //var accessToken = result.data.access_token;
            var openid = result.data.openid;
            client.getUser(openid, function (err, result) {
                if (err) {
                    res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
                } else {
                    var userInfo = result;

                    //req.cookies.setAttribute('1','1');
                    //req.session.userInfo = userInfo;

                    models.weixinMessageModel.addUserInfo(userInfo, function (err) {
                        if (err) {
                            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
                        } else {
                            res.redirect(req.params.from+'/'+openid);
                        }
                    });
                }
            });
        }
    });
});

/************************************************************************订座*/

/*
 * Get buildings of a school
 * 获取教学楼列表
 * */
router.get('/building', function (req, res) {
    models.classroomModel.getAll(1, function (err, classroomList) {
        if (err) {
            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
        }
        else {
            res.render('buildingView', {title: '七玥天使-自习室导航', classroomList: classroomList});
        }
    });
});

/*
 * Get buildings of a school
 * 获取教学楼列表
 * */
router.get('/buildingClassroom/:areaId', function (req, res) {
    if (req.session.userInfo) {
        models.classroomModel.getByAreaID(req.params.areaId, function (err, classroomList) {
            if (err) {
                res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
            }
            else {
                res.render('buildingClassroomView', {title: '七玥校园', classroomList: classroomList});
            }
        });
    } else {
        var client = new OAuth('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
        var url = client.getAuthorizeURL('http://www.julyangel.cn/callbackbuilding', '123', 'snsapi_userinfo');
        res.redirect(url);
    }
});

/*
 * Get seat map of a classroom
 * 获取一个教室的座位图
 * */
router.get('/librarySeatMap/:cid', function (req, res) {

    models.classroomModel.getOrderByDayType(req.params.cid, req.query.t, function (err, classroom) {
        if (err) {
            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
        }
        else {
            models.classroomModel.getOrder(req.params.cid, req.query.t, function (err, orders) {
                if (err) {
                    res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
                } else {
                    var seatMapStr = classroom['seat_map'];
                    var seatMapArr = seatMapStr.split(';');
                    for (var orderIndex = 0; orderIndex < orders.length; orderIndex++) {
                        var str = seatMapArr[orders[orderIndex].row_no - 1];
                        var order_seat_sex = 'g';
                        if (orders[orderIndex].sex == 1) {
                            order_seat_sex = 'b';
                        }
                        seatMapArr[orders[orderIndex].row_no - 1] =
                            str.substring(0, orders[orderIndex].column_no - 1)
                            + order_seat_sex
                            + str.substring(orders[orderIndex].column_no, str.length);
                    }
                    seatMapArr.pop();

                    /*var map = ['aaa_aaaaaaaaa_aaa',
                     'aaa_aaaaaabaa_aaa',
                     'aaa_aaaabaaaa_aaa',
                     'aaa_aaaaaagaa_aga',
                     'aaa_aaataaaaa_aaa',
                     'aaa_ataaaaaaa_aaa',
                     'aaa_aaaaagaaa_aaa',
                     'aaa_aataaaaaa_aaa',
                     'aaa_aaaaaaaaa_aaa'];*/

                    var today = new Date(),
                        nextDay = new Date(today.getTime() + 24 * 60 * 60 * 1000);

                    res.render('librarySeatMapView', {
                        title: classroom['full_name'],
                        classroom: classroom,
                        map: seatMapArr,
                        cid: req.params.cid,
                        today: today,
                        nextDay: nextDay,
                        type: req.query.t
                    });
                }
            });
        }
    });

});

/*
 * 提交订座申请
 * 2016-04-08 CHEN PU 新建
 * */
router.post('/order', function (req, res) {
    if (req.session.userInfo) {
        //var dateArr = req.body.time.split(' ');
        //var hour = dateArr[0].substr(0, dateArr[0].length-1);
        //var minute = dateArr[1].substr(0, dateArr[1].length-1);
        //var today = new Date();
        //var orderTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);

        var startTime;
        var today = new Date();
        if (req.body.type == 'tomorrow') {
            var nextDay = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            startTime = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate());
        } else {
            startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        }
        var endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

        models.userModel.newOrder(req.session.userInfo.openid, req.body.classroom, req.body.row, req.body.column, req.body.seatCode, startTime, endTime, function (err) {
            if (err) {
                res.send(err);
            } else {
                res.send('已成功预定');
            }
        });
    }
    else {
        res.send('未取得用户信息');
    }
});

/************************************************************************我的*/

/*
 * 我的页面
 * 2016-04-05 CHEN PU 新建
 * 2016-04-12 CHEN PU 调整代码,用querystring传递openid
 * */
router.get('/me', function (req, res) {
    models.userModel.getSeatActiveOrderSheet(req.params.openid, function (err, userSeatOrders) {
        if (err) {
            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
        } else {
            models.userModel.getLeaveApplication(req.params.openid, function (err, leaveApplications) {
                if (err) {
                    res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
                } else {
                    
                    models.userModel.getUser(req.params.openid, function(err, userInfo){
                        if(err){
                            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
                        }else{
                            res.render('meView', {
                                title: '我的信息',
                                userInfo: userInfo[0],
                                userSeatOrders: userSeatOrders,
                                leaveApplications: leaveApplications
                            });
                        }
                    });
                }
            });
        }
    });
});

router.get('/medebug', function (req, res) {
    var userInfo = {
        nickname: '璞',
        province: '北京',
        city: '昌平',
        headimgurl: 'http://wx.qlogo.cn/mmopen/PiajxSqBRaEJLKaunSsjF2ky7vkXEicrZ21h6StXw0brPib0AUex7LOR42NKU2P0l5sJWPiavjH0h1M8DcmHd02B1aqmcUFcibEJ5sIcKqneLtf4/0'
    };

    models.userModel.getSeatActiveOrderSheet('oF4F0sxpbSEw5PETECnqB93JS1uc', function (err, userSeatOrders) {
        if (err) {
            res.send('错误' + err);
        } else {

            models.userModel.getLeaveApplication('oF4F0sxpbSEw5PETECnqB93JS1uc', function (err, leaveApplications) {
                if (err) {
                    res.send('错误' + err);
                } else {
                    res.render('meView', {
                        title: '我的信息',
                        userInfo: req.session.userInfo,
                        userSeatOrders: userSeatOrders,
                        leaveApplications: leaveApplications
                    });
                }
            });
        }
    });
});

/*
 * 释放座位
 * 2016-04-08 CHEN PU 新建
 * */
router.post('/release', function (req, res) {
    models.userModel.releaseSeat(req.body.orderID, function (err, results) {
        if (err) {
            res.send('释放失败，请重试');
        } else {
            res.send('座位已经成功释放');
        }
    });
});

/*
 * 暂离座位
 * 2016-04-08 CHEN PU 新建
 **/
router.post('/leave', function (req, res) {
    models.userModel.leaveSeat(req.body.orderID, function (err, results) {
        if (err) {
            res.send('设置暂离失败，请重试');
        } else {
            res.send('设置暂离成功');
        }
    });
});

/*
 * 实名认证页面
 * 2016-04-11 CHEN PU 新建
 * */
router.get('/realInfo', function (req, res) {
    models.departmentClassModel.getActiveDepartments(function (err, departments) {
        if (err) {
            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
        } else {
            var departmentNameArr = new Array();
            for (var index = 0; index < departments.length; index++) {
                departmentNameArr[index] = departments[index].department_name;
            }
            res.render('realInfoView', {title: '实名认证', departments: departmentNameArr});
        }
    });
});

/*
 * 提交用户实名信息
 * 2016-04-11 CHEN PU 新建
 * */
router.post('/realInfo', function (req, res) {
    if (req.session.userInfo) {
        models.userModel.fillRealInfo(
            req.body.name,
            req.body.code,
            req.body.department,
            req.body.classs,
            req.session.userInfo.openid,
            function (err, result) {
                if (err) {
                    res.send('亲，出错了额，请重试一下' + err.message);
                } else {
                    res.send('亲，您的信息已认证');
                }
            });
    } else {
        res.send('亲，出错了额，请重试一下');
    }
});

/*
 * 实名认证页面上获取对应学院的下属班级列表
 * 2016-04-11 CHEN PU 新建
 * */
router.post('/class', function (req, res) {
    models.departmentClassModel.getClass(req.body.department, function (err, classs) {
        var classStr = '';
        for (var index = 0; index < classs.length; index++) {
            classStr += classs[index].class_name;
            if (index < classs.length - 1) {
                classStr += ',';
            }
        }
        res.send(classStr);
    });
});


/*************************************************************************请假*/
/*
 * 填写请假申请表单的页面
 * 2016-04-11 CHEN PU   新建
 * */
router.get('/applyLeave', function (req, res) {
    res.render('applyLeaveView', {title: '请假申请'});
});

/*
 * 提交请假申请信息
 * 2016-04-11 CHEN PU   新建
 * */
router.post('/applyLeave', function (req, res) {
    if (req.session.userInfo) {
        models.userModel.applyLeave(
            req.body.leaveReason,
            req.body.startTime,
            req.body.endTime,
            req.session.userInfo.openid,
            function (err, results) {
                if (err) {
                    res.send('亲，出错了额，请重试一下' + err.message);
                } else {
                    res.send('亲，您的申请已提交');
                }
            }
        );
    } else {
        res.send('亲，出错了额，请重试一下');
    }
});


module.exports = router;
