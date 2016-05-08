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
    debug = require('debug'),
    log = debug('seat'),
    support = require('../lib/support'),
    weixinAPIClient = models.weixinAPIClient.getInstance('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

/*OAuth = require('wechat-oauth'),
 WeiJSAPI = require('../lib/weixin-jssdk'),*/
/*var weiJSAPI = new WeiJSAPI('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
var client = new OAuth('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');*/

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
router.post('/seat/order', function (req, res) {
    //var dateArr = req.body.time.split(' ');
    //var hour = dateArr[0].substr(0, dateArr[0].length-1);
    //var minute = dateArr[1].substr(0, dateArr[1].length-1);
    //var today = new Date();
    //var orderTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);

    models.seatModel.getOrderRelatedDateByDayType(req.body.type, function (startTime, endTime, scheduleRecoverTime) {
        models.seatModel.isValidLibraryOrderRequest(req.body.openid, req.body.classroom, req.body.seatCode, startTime, endTime, function (err) {
            if (err) {
                res.send(err.message);
            } else {
                models.seatModel.createOrder(req.body.openid, req.body.classroom, req.body.seatCode, req.body.row, req.body.column, startTime, endTime, scheduleRecoverTime,
                    function (err, newOrderId) {
                        if (err) {
                            res.send(err.message);
                        } else {
                            res.send('你已成功预订座位'+req.body.seatCode+', 请于'+scheduleRecoverTime.toLocaleString()+'之前扫码签到, 过时座位将被系统自动回收。');
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
router.post('/seat/release', function (req, res) {
    models.seatModel.release(req.body.orderID, req.body.openid, function (err, results) {
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
router.post('/seat/leave', function (req, res) {
    models.seatModel.leave(req.body.orderID, req.body.openid, function (err, results) {
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
    var url = weixinAPIClient.oAuthClient.getAuthorizeURL('http://campus.julyangel.cn/scanclassroom/oauthgetinfo?cid=' + req.params.cid + '&schoolID=' + req.params.schoolID, '123', 'snsapi_userinfo');
    res.redirect(url);
});

/*
 * 扫描教室二维码进行签到 第二步
 *
 * 2016-04-19 CHEN PU 新建
 * */
router.get('/scanclassroom/oauthgetinfo', function (req, res) {
    weixinAPIClient.oAuthClient.getAccessToken(req.query.code, function (err, result) {
        if (err) {
            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
        }
        else {
            //var accessToken = result.data.access_token;
            var openid = result.data.openid;
            weixinAPIClient.oAuthClient.getUser({openid: openid, lang: "zh_CN"}, function (err, result) {
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

router.get('/scanseat/oauth/:schoolID/:cid/:seat/:row/:column', function (req, res) {
    var url = weixinAPIClient.oAuthClient.getAuthorizeURL('http://campus.julyangel.cn/scanseat/oauthprecheck?cid=' +
        req.params.cid + '&schoolID=' + req.params.schoolID + '&seat=' + req.params.seat+
        '&row='+req.params.row+'&column='+req.params.column,
        '123', 'snsapi_userinfo');
    res.redirect(url);
});

router.get('/scanseat/oauthprecheck', function (req, res) {
    weixinAPIClient.oAuthClient.getAccessToken(req.query.code, function (err, result) {
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
            weixinAPIClient.oAuthClient.getUser({openid: openid, lang: "zh_CN"}, function (err, result) {

                var userInfo = result;
                models.weixinMessageModel.addUserInfo(req.query.schoolID, userInfo, function (err) {
                    var url = decodeURIComponent('http://' + req.headers.host + req.originalUrl);
                    weixinAPIClient.jsAPIClient.getJSConfig(url, function (err, weiJSConfig) {
                        if (err) {
                            res.render('errorView', {
                                openid: 'wxeec4313f49704ee2',
                                title: '服务器故障',
                                message: '服务器故障',
                                error: err
                            });
                        }else{
                            res.render('./seat/precheckView', {
                                openid: openid,
                                classroomID:req.query.cid,
                                seat:req.query.seat,
                                row:req.query.row,
                                column:req.query.column,
                                weiJSConfig: weiJSConfig,
                                title: '座位状态'
                            });
                        }
                    });                    
                });
            });
        }
    });
});

router.post('/scanseat/checkLocation', function (req, res) {
    models.classroomModel.getByID(req.body.classroomID, function(err, classroom){
        var distance = support.distance(req.body.longitude, req.body.latitude, classroom[0].longitude, classroom[0].latitude);
        if(distance < 1000){
            var angelCode = support.random(5);

            models.userModel.setAngelCode(req.body.openid, angelCode, function(err, result){
                var result = {retcode:1, angelcode:angelCode, message:distance};
                res.send(result);
            });
        }
        else{
            var result = {retcode:-11, angelcode:'', message:'你所在区域不在规定的地理区域内, 不能进行该操作。'};
            res.send(result);
        }
    });
});

router.get('/scanseat/seatoperation', function(req, res){

    var openid = req.query.openid;

    models.userModel.getUser(openid, function(err, user){
        if(user[0].angelcode != req.query.angelcode)
        {

        }
        else
        {
            models.userModel.setAngelCode(openid, '', function(err, result){

            });

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
                                var promptMsg = '你已成功签到, 请遵守座位使用规则, 暂离请扫码(如未扫码暂离, 其它同学可扫码获得此座, 你将被记录违规一次), 用完请退座。';

                                models.seatModel.getLog(req.query.cid, req.query.seat, function (err, seatLogs) {

                                    res.render('./seat/scanSeatView',
                                        {
                                            openid: openid,
                                            title: '座位状态',
                                            statusType: 'signed',
                                            classroom: seatOrders[0].full_name,
                                            seat: req.query.seat,
                                            orderID:seatOrders[0].order_id,
                                            seatLogs: seatLogs,
                                            promptMsg: promptMsg
                                        });
                                });
                            });
                        }
                        // 如果非本人 提示不能预约
                        else
                        {
                            models.seatModel.getLog(req.query.cid, req.query.seat, function (err, seatLogs) {
                                var statusType = 'singed-others';
                                if(seatOrders[0].status == 3){
                                    statusType = 'leaved-others';
                                }

                                res.render('./seat/scanSeatView',
                                    {
                                        openid: openid,
                                        title: '座位状态',
                                        statusType: statusType,
                                        classroom: seatOrders[0].full_name,
                                        seat: req.query.seat,
                                        orderID:-1,
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
                            models.seatModel.leave(seatOrders[0].order_id, openid, function (err, scheduleRecoverDate) {
                                var promptMsg = '感谢你遵守文明用座规范, 现已成功设置暂离, 座位将为你保留至'+scheduleRecoverDate.toLocaleTimeString()+
                                    ', 请于此时间之前返回扫码签到, 否则座位将会被系统回收。';
                                models.seatModel.getLog(req.query.cid, req.query.seat, function (err, seatLogs) {
                                    res.render('./seat/scanSeatView',
                                        {
                                            openid: openid,
                                            title: '座位状态',
                                            statusType: 'leaved',
                                            classroom: seatOrders[0].full_name,
                                            seat: req.query.seat,
                                            orderID:seatOrders[0].order_id,
                                            seatLogs: seatLogs,
                                            promptMsg: promptMsg
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
                                                        statusType: 'signed-others',
                                                        classroom: seatOrders[0].full_name,
                                                        seat: req.query.seat,
                                                        orderID:-1,
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
                                        models.seatModel.release(seatOrders[0].order_id, eatOrders[0].openid, function (err, result) {

                                            models.seatModel.createOrder(openid, req.query.cid, req.query.seat, req.query.row, req.query.column, startTime, endTime, scheduleRecoverTime, function (err, newOrderId) {

                                                models.seatModel.sign(newOrderId, function (err, scheduleRecoverDate) {

                                                    models.seatModel.getLog(req.query.cid, req.query.seat, function (err, seatLogs) {

                                                        var promptMsg = '你已成功签到, 请遵守座位使用规则, 暂离请扫码(如未扫码暂离, 其它同学可扫码获得此座, 你将被记录违规一次), 用完请退座。';
                                                        res.render('./seat/scanSeatView',
                                                            {
                                                                openid: openid,
                                                                title: '座位状态',
                                                                statusType: 'signed',
                                                                classroom: seatLogs[0].full_name,
                                                                seat: req.query.seat,
                                                                orderID:newOrderId,
                                                                seatLogs: seatLogs,
                                                                promptMsg: promptMsg
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
                    models.seatModel.tryCreateLibraryOrder('today', openid, req.query.cid, req.query.seat, req.query.row, req.query.column, function (err, newOrderId) {
                        // 此学生有其他座位
                        if (err)
                        {
                            if (err.type == 'prompt') {
                                var promptMsg = err.message;
                                models.classroomModel.getByID(req.query.cid, function (err, classroom) {

                                    models.seatModel.getLog(req.query.cid, req.query.seat, function (err, seatLogs) {

                                        res.render('./seat/scanSeatView',
                                            {
                                                openid: openid,
                                                title: '座位状态',
                                                statusType: 'empty',
                                                classroom: classroom[0].full_name,
                                                seat: req.query.seat,
                                                orderID:-1,
                                                seatLogs: seatLogs,
                                                promptMsg: promptMsg
                                            });
                                    });
                                });
                            }
                        }
                        // 此学生没有其他座位
                        else
                        {
                            models.seatModel.sign(newOrderId, function (err, scheduleRecoverDate) {
                                var promptMsg = '你已成功签到, 请遵守座位使用规则, 暂离请扫码(如未扫码暂离, 其它同学可扫码获得此座, 你将被记录违规一次), 用完请退座。';
                                models.seatModel.getLog(req.query.cid, req.query.seat, function (err, seatLogs) {
                                    res.render('./seat/scanSeatView',
                                        {
                                            openid: openid,
                                            title: '座位状态',
                                            statusType: 'signed',
                                            classroom: seatLogs[0].full_name,
                                            seat: req.query.seat,
                                            orderID:newOrderId,
                                            seatLogs: seatLogs,
                                            promptMsg: promptMsg
                                        });
                                });
                            });
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;