/**
 * Created by Administrator on 2016/4/14.
 * 查座选座
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
    log = debug('seat');

var weiJSAPI = new WeiJSAPI('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
var client = new OAuth('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
/*
 * Get buildings of a school
 * 获取教学楼列表
 * */
router.get('/building/:openid', function (req, res) {

    models.userModel.getUser(req.params.openid, function (err, userInfo) {
        if (err) {
            res.render('errorView', {
                openid: req.params.openid,
                title: '服务器故障',
                message: '服务器故障',
                error: err
            });
        } else {

            models.classroomModel.getAll(userInfo.school_id, function (err, classroomList) {
                if (err) {
                    res.render('errorView', {
                        openid: req.params.openid,
                        title: '服务器故障',
                        message: '服务器故障',
                        error: err
                    });
                }
                else {
                    res.render('./seat/buildingView',
                        {
                            ip: req.query.ip,
                            openid: req.params.openid,
                            title: '七玥天使-自习室导航',
                            classroomList: classroomList
                        });
                }
            });
        }
    });

});

/*
 * Get buildings of a school
 * 获取教学楼内教室列表
 * */
router.get('/buildingClassroom/:areaId/:openid', function (req, res) {
    models.classroomModel.getByAreaID(req.params.areaId, function (err, classroomList) {
        if (err) {
            res.render('errorView', {openid: req.params.openid, title: '服务器故障', message: '服务器故障', error: err});
        }
        else {
            res.render('./seat/buildingClassroomView',
                {
                    openid: req.params.openid,
                    title: '七玥校园',
                    classroomList: classroomList
                });
        }
    });
});

/*
 * Get seat map of a classroom
 * 获取一个教室的座位图
 * */
router.get('/libraryClassroom/:cid/:openid', function (req, res) {

    models.classroomModel.getOrderByDayType(req.params.cid, req.query.t, function (err, classroom) {
        if (err) {
            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
        }
        else {
            models.classroomModel.getOrder(req.params.cid, req.query.t, function (err, orders) {
                if (err) {
                    res.render('errorView', {openid: req.params.openid, title: '服务器故障', message: '服务器故障', error: err});
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

                    res.render('./seat/libraryClassroomView', {
                        openid: req.params.openid,
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
    //var dateArr = req.body.time.split(' ');
    //var hour = dateArr[0].substr(0, dateArr[0].length-1);
    //var minute = dateArr[1].substr(0, dateArr[1].length-1);
    //var today = new Date();
    //var orderTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);

    models.seatModel.getOrderRelatedDateByDayType(req.body.type, function (startTime, endTime, scheduleRecoverTime) {
        models.seatModel.isValidLibraryOrderRequest(req.body.openid, req.body.classroom, req.body.seatCode, startTime, endTime, function (err) {
            if (err) {
                if (err.type == 'exception') {
                    res.render('errorView', {openid: req.body.openid, title: '服务器故障', message: '服务器故障', error: err});
                } else {
                    res.render('./seat/scanSeatView', {
                        openid: req.body.openid,
                        title: '座位状态',
                        statusType: 'prompt',
                        promptMsg: err.message
                    });
                }
            } else {
                models.seatModel.createOrder(openid, req.body.classroom, req.body.seatCode, startTime, endTime, scheduleRecoverTime,
                    function (err, newOrderId) {
                        if (err) {
                            res.render('errorView', {
                                openid: req.body.openid,
                                title: '服务器故障',
                                message: '服务器故障',
                                error: err
                            });
                        } else {
                            models.seatModel.sign(newOrderId, function (err, result) {
                                if (err) {
                                    res.render('errorView', {
                                        openid: req.body.openid,
                                        title: '服务器故障',
                                        message: '服务器故障',
                                        error: err
                                    });
                                } else {
                                    models.classroomModel.getByID(req.body.classroom, function (err, classroom) {
                                        if (err) {
                                            res.render('errorView', {
                                                openid: req.body.openid,
                                                title: '服务器故障',
                                                message: '服务器故障',
                                                error: err
                                            });
                                        } else {
                                            res.render('./seat/scanSeatView', {
                                                openid: req.body.openid,
                                                title: '座位状态',
                                                statusType: 'signed',
                                                classroom: classroom[0].full_name,
                                                seat: req.body.seatCode
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
            }
        });
    });
});

/*
 * 释放座位
 * 2016-04-08 CHEN PU 新建
 * */
router.post('/me/release', function (req, res) {
    models.seatModel.release(req.body.orderID, function (err, results) {
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
router.post('/me/leave', function (req, res) {
    models.seatModel.leave(req.body.orderID, function (err, results) {
        if (err) {
            res.send('设置暂离失败，请重试');
        } else {
            res.send('设置暂离成功');
        }
    });
});

router.get('/me/oldSeat/:openid', function (req, res) {
    models.seatModel.getOld(req.params.openid, function (err, oldOrders) {
        if (err) {
            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
        } else {
            res.render('./seat/oldSeatView', {
                title: '历史座位',
                openid: req.params.openid,
                oldOrders: oldOrders
            });
        }
    });
});


/*
 * 扫描教室二维码进行签到 第一步
 *
 * 2016-04-19 CHEN PU 新建
 * */
router.get('/scanclassroom/oauth/:schoolID/:cid', function (req, res) {
    var url = client.getAuthorizeURL('http://campus.julyangel.cn/scanclassroom/oauthgetinfo?cid=' + req.params.cid + '&schoolID=' + req.params.schoolID, '123', 'snsapi_userinfo');
    res.redirect(url);
});

/*
 * 扫描教室二维码进行签到 第二步
 *
 * 2016-04-19 CHEN PU 新建
 * */
router.get('/scanclassroom/oauthgetinfo', function (req, res) {
    client.getAccessToken(req.query.code, function (err, result) {
        if (err) {
            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
        }
        else {
            //var accessToken = result.data.access_token;
            var openid = result.data.openid;
            client.getUser({openid: openid, lang: "zh_CN"}, function (err, result) {
                if (err) {
                    res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
                } else {
                    var userInfo = result;

                    models.weixinMessageModel.addUserInfo(req.query.schoolID, userInfo, function (err) {
                        if (err) {
                            res.render('errorView', {openid: openid, title: '服务器故障', message: '服务器故障', error: err});
                        } else {
                            // 检索该用户是否有这个教室的今天的座位预约
                            models.seatModel.getMyTodayOrderWithinClassroom(req.query.cid, openid, function (err, userOrders) {
                                if (err) {
                                    res.render('errorView', {
                                        openid: openid,
                                        title: '服务器故障',
                                        message: '服务器故障',
                                        error: err
                                    });
                                } else if (userOrders.length > 0) {
                                    models.seatModel.sign(userOrders[0].order_id, function (err, result) {
                                        if (err) {
                                            res.render('errorView', {
                                                openid: openid,
                                                title: '服务器故障',
                                                message: '服务器故障',
                                                error: err
                                            });
                                        } else {
                                            res.redirect('/me/' + openid);
                                        }
                                    });
                                } else {
                                    res.redirect('/libraryClassroom/' + req.query.cid + '/' + openid);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});


router.get('/scanseat/oauth/:schoolID/:cid/:seat', function (req, res) {
    var url = client.getAuthorizeURL('http://campus.julyangel.cn/scanseat/oauthgetinfo?cid=' +
        req.params.cid + '&schoolID=' + req.params.schoolID + '&seat=' + req.params.seat, '123', 'snsapi_userinfo');
    res.redirect(url);
});

router.get('/scanseat/oauthgetinfo', function (req, res) {
    client.getAccessToken(req.query.code, function (err, result) {
        if(err){
            res.render('errorView', {
                openid: '',
                title: '服务器故障',
                message: '服务器故障',
                error: err
            });
        }else{
            //var accessToken = result.data.access_token;
            var openid = result.data.openid;
            client.getUser({openid: openid, lang: "zh_CN"}, function (err, result) {

                var userInfo = result;
                models.weixinMessageModel.addUserInfo(req.query.schoolID, userInfo, function (err) {

                    // 检索该座位是否有人预约
                    models.seatModel.checkOrderBySeatCode(req.query.cid, req.query.seat, function (err, seatOrders) {
                        // 有人预约
                        if (seatOrders.length > 0)
                        {
                            // 预定或暂离状态
                            if (seatOrders[0].status == 1 || seatOrders[0].status == 3)
                            {
                                // 处于预定状态的座位 如果是本人 执行签到操作
                                if (seatOrders[0].openid == openid)
                                {
                                    models.seatModel.sign(seatOrders[0].order_id, function (err, result) {
                                        models.seatModel.getLog(req.query.cid, req.query.seat, function (err, seatLogs) {

                                            res.render('./seat/scanSeatView',
                                                {
                                                    openid: openid,
                                                    title: '座位状态',
                                                    statusType: 'signed',
                                                    classroom: seatOrders[0].full_name,
                                                    seat: req.query.seat,
                                                    seatLogs: seatLogs,
                                                    promptMsg: ''
                                                });
                                        });
                                    });
                                }
                                // 如果非本人 提示不能预约
                                else
                                {
                                    models.seatModel.getLog(req.query.cid, req.query.seat, function (err, seatLogs) {
                                        var statusType = 'prompt-singed';
                                        if(seatOrders[0].status == 3){
                                            statusType = 'prompt-leaved';
                                        }

                                        res.render('./seat/scanSeatView',
                                            {
                                                openid: openid,
                                                title: '座位状态',
                                                statusType: statusType,
                                                classroom: seatOrders[0].full_name,
                                                seat: req.query.seat,
                                                seatLogs: seatLogs,
                                                promptMsg: '这个座位已被其他小伙伴预约, 咱们重新去找个座位吧'
                                            });
                                    });
                                }
                            }
                            else
                            // 签到状态
                            if (seatOrders[0].status == 2)
                            {
                                // 本人已签到的座位 执行暂离操作
                                if (seatOrders[0].openid == openid)
                                {
                                    models.seatModel.leave(seatOrders[0].order_id, function (err, result) {
                                        models.seatModel.getLog(req.query.cid, req.query.seat, function (err, seatLogs) {
                                            res.render('./seat/scanSeatView',
                                                {
                                                    openid: openid,
                                                    title: '座位状态',
                                                    statusType: 'leaved',
                                                    classroom: seatOrders[0].full_name,
                                                    seat: req.query.seat,
                                                    seatLogs: seatLogs,
                                                    promptMsg: ''
                                                });
                                        });
                                    });
                                }
                                // 不是本人的座位，检查此人是否有其他座位，如没有，则将此座位释放，然后分配给此人，并执行签到
                                else {
                                    models.seatModel.getOrderRelatedDateByDayType('today', function (startTime, endTime, scheduleRecoverTime) {
                                        models.seatModel.isValidLibraryOrderRequest(openid, req.query.cid, req.query.seat, startTime, endTime, function (err) {
                                            // 出错 或 已有其它座位 不能预约
                                            if (err)
                                            {
                                                // 有其他座位 不能预约
                                                if (err.type == 'prompt') {
                                                    models.seatModel.getLog(req.query.cid, req.query.seat, function (err, seatLogs) {
                                                        res.render('./seat/scanSeatView',
                                                            {
                                                                openid: openid,
                                                                title: '座位状态',
                                                                statusType: 'prompt-signed',
                                                                classroom: seatOrders[0].full_name,
                                                                seat: req.query.seat,
                                                                seatLogs: seatLogs,
                                                                promptMsg: err.message
                                                            });
                                                    });
                                                }
                                            }
                                            // 没有其它座位 可以预约此座位
                                            else
                                            {
                                                // 释放座位
                                                models.seatModel.release(seatOrders[0].order_id, function (err, result) {

                                                    models.seatModel.createOrder(openid, req.query.cid, req.query.seat, startTime, endTime, scheduleRecoverTime, function (err, newOrderId) {

                                                        models.seatModel.sign(newOrderId, function (err, result) {

                                                            models.seatModel.getLog(req.query.cid, req.query.seat, function (err, seatLogs) {

                                                                res.render('./seat/scanSeatView',
                                                                    {
                                                                        openid: openid,
                                                                        title: '座位状态',
                                                                        statusType: 'signed',
                                                                        classroom: seatLogs[0].full_name,
                                                                        seat: req.query.seat,
                                                                        seatLogs: seatLogs,
                                                                        promptMsg: ''
                                                                    });
                                                            });
                                                        });
                                                    });
                                                });
                                            }
                                        });
                                    });
                                }
                            }
                        }
                        // 无人预约
                        else
                        {
                            models.seatModel.tryCreateLibraryOrder('today', openid, req.query.cid, req.query.seat, function (err, newOrderId) {
                                // 此学生有其他座位
                                if (err)
                                {
                                    if (err.type == 'prompt') {
                                        models.classroomModel.getByID(req.query.cid, function (err, classroom) {

                                            models.seatModel.getLog(req.query.cid, req.query.seat, function (err, seatLogs) {

                                                res.render('./seat/scanSeatView',
                                                    {
                                                        openid: openid,
                                                        title: '座位状态',
                                                        statusType: 'prompt-empty',
                                                        classroom: classroom[0].full_name,
                                                        seat: req.query.seat,
                                                        seatLogs: seatLogs,
                                                        promptMsg: err.message
                                                    });
                                            });
                                        });
                                    }
                                }
                                // 此学生没有其他座位
                                else
                                {
                                    models.seatModel.sign(newOrderId, function (err, result) {

                                        models.seatModel.getLog(req.query.cid, req.query.seat, function (err, seatLogs) {

                                            res.render('./seat/scanSeatView',
                                                {
                                                    openid: openid,
                                                    title: '座位状态',
                                                    statusType: 'signed',
                                                    classroom: seatLogs[0].full_name,
                                                    seat: req.query.seat,
                                                    seatLogs: seatLogs,
                                                    promptMsg: ''
                                                });
                                        });
                                    });
                                }
                            });
                        }
                    });
                });
            });
        }

    });
});

module.exports = router;