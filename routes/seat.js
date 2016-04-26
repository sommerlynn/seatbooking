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
    WeiJSAPI = require('../lib/weixin-jssdk');

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

    models.seatModel.newOrder(req.body.openid, req.body.classroom, req.body.row, req.body.column, req.body.seatCode, req.body.type, function (err) {
        if (err) {
            res.send(err);
        } else {
            res.send('已成功预定');
        }
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

router.get('/me/oldSeat/:openid', function(req, res){
    models.seatModel.getOld(req.params.openid, function(err, oldOrders){
        if(err){
            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
        }else{
            res.render('./seat/oldSeatView', {
                title: '历史座位',
                openid: req.params.openid,
                oldOrders:oldOrders
            });
        }
    });
});


/*
* 扫描教室二维码进行签到 第一步
*
* 2016-04-19 CHEN PU 新建
* */
router.get('/scanclassroom/oauth/:schoolID/:cid', function(req, res){
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
                            models.seatModel.getMyTodayOrderWithinClassroom(req.query.cid, openid, function(err, userOrders){
                                if(err){
                                    res.render('errorView', {openid: openid, title: '服务器故障', message: '服务器故障', error: err});
                                }else if(userOrders.length > 0)
                                {
                                    models.seatModel.sign(userOrders[0].order_id, function(err, result){
                                        if(err){
                                            res.render('errorView', {openid: openid, title: '服务器故障', message: '服务器故障', error: err});
                                        }else{
                                            res.redirect('/me/' + openid);
                                        }
                                    });
                                }else{
                                    res.redirect('/libraryClassroom/' +req.query.cid+'/'+ openid);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});


router.get('/scanseat/oauth/:schoolID/:cid/:seat', function(req, res){
    var url = client.getAuthorizeURL('http://campus.julyangel.cn/scanseat/oauthgetinfo?cid=' +
        req.params.cid + '&schoolID=' + req.params.schoolID+'&seat='+req.params.seat, '123', 'snsapi_userinfo');
    res.redirect(url);
});

router.get('/scanseat/oauthgetinfo', function(req, res){
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
                            models.seatModel.getMyTodayOrderWithinClassroom(req.query.cid, openid, function(err, userOrders){
                                if(err){
                                    res.render('errorView', {openid: openid, title: '服务器故障', message: '服务器故障', error: err});
                                }else if(userOrders.length > 0)
                                {
                                    if(userOrders[0].seat_code == req.query.seat){
                                        if(userOrders[0].status == 0 || userOrders[0].status == 3 ){
                                            // 当前状态为预约 执行签到
                                            models.seatModel.sign(userOrders[0].order_id, function(err, result){
                                                if(err){
                                                    res.render('errorView', {openid: openid, title: '服务器故障', message: '服务器故障', error: err});
                                                }else{
                                                    //res.redirect('/me/' + openid);
                                                    var msg = userOrders[0].nickname+', 你已成功签到座位 '+ userOrders[0].seat_code;
                                                    res.render('./seat/scanSeatView', {openid: openid, title: '座位状态', message: msg});
                                                }
                                            });
                                        }else{
                                            // 当前状态为签到 提示
                                            var msg = userOrders[0].nickname+', 你已成功签到座位 '+ userOrders[0].seat_code;
                                            res.render('./seat/scanSeatView', {openid: openid, title: '座位状态', message: msg});
                                        }
                                    }
                                    else{
                                        // 提示 扫错座位了，你在该教室预约的座位是XXX 号
                                        var msg = userOrders[0].nickname+', 咱是不是走错位了呢? 咱的预约好像是 '+ userOrders[0].seat_code + '号, 不是'+
                                            req.query.seat+'呀, 赶紧去【我的座位】里看看';
                                        res.render('./seat/scanSeatView', {openid: openid, title: '座位状态', message: msg});
                                    }
                                }else{
                                    // 检索该座位是否有人预约 如果没有人预约 则执行预约签到
                                    models.seatModel.checkOrderBySeatCode(req.query.cid, req.query.seat, function(err, seatOrders){
                                       if(err){
                                           res.render('errorView', {openid: openid, title: '服务器故障', message: '服务器故障', error: err});
                                       } else{
                                           if(seatOrders.length > 0){
                                               if(seatOrders[0].status == 1){
                                                   // 处于预定状态的座位，不能进行预约
                                                   var msg = '哎呀，这个座位已被'+ seatOrders[0].nickname+'预约了，你看咱是不是选个别的座位呢?';
                                                   res.render('./seat/scanSeatView', {openid: openid, title: '座位状态', message: msg});
                                               }else if(seatOrders[0].status == 2){
                                                   // 已签到的座位，如果能被扫描说明未按要求设置暂离，可对该座位先释放，再分配给新的用户
                                                   res.render('./seat/scanSeatView', {openid: openid, title: '座位状态', message: '测试1'});

                                               }else if(seatOrders[0].status == 3){
                                                   // 处于暂离状态的座位，不能进行预约
                                                   var msg = '哎呀，这个座位已被'+ seatOrders[0].nickname+'预约了，你看咱是不是选个别的座位呢?';
                                                   res.render('./seat/scanSeatView', {openid: openid, title: '座位状态', message: msg});
                                               }
                                           }else{
                                               // 该座位无有效预定，执行预约、签到
                                               res.render('./seat/scanSeatView', {openid: openid, title: '座位状态', message: '测试2'});
                                           }
                                       }
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

module.exports = router;