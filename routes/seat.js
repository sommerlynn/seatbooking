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
    weixinAPIClient = models.weixinClient.getInstance('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

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

            models.classroomModel.getNormalBuilding(userInfo[0].school_id, function (err, zones) {
                var zonesArr = [];
                for(var index = 0; index < zones.length; index++){
                    zonesArr[index] = zones[index].area_name;
                }

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
                        res.render('./seat/buildingView',
                            {
                                ip: req.query.ip,
                                openid: req.params.openid,
                                schoolID:userInfo[0].school_id,
                                title: '自习座位',
                                zones: zonesArr,
                                weiJSConfig: weiJSConfig,
                            });    
                    }
                });
            });
            
            /*models.classroomModel.getAll(userInfo.school_id, function (err, classroomList) {
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
                            title: '自习座位',
                            classroomList: classroomList
                        });
                }
            });*/
        }
    });

});

router.get('/emptyClassroom/:school/:area/:sectionStr/:openid', function (req, res) {
    var school = req.params.school,
        area = req.params.area,
        sectionStr = req.params.sectionStr,
        now = new Date(),
        today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    models.classroomModel.getEmptyClassroom(area, sectionStr, today, function(err, classrooms){

        models.classroomModel.getNormalBuilding(school, function (err, zones) {
            var zonesArr = [];
            for(var index = 0; index < zones.length; index++){
                zonesArr[index] = zones[index].area_name;
            }

            res.render('./seat/emptyClassroomView',
                {
                    openid: req.params.openid,
                    title: '空教室',
                    classroomList: classrooms,
                    zones: zonesArr,
                    schoolID:school,
                    zone:area,
                    sectionStr:sectionStr
                });
        });

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
                    title: '自习室导航',
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
                        var str = seatMapArr[orders[orderIndex].row_no*2];
                        var order_seat_sex = 'g';
                        if (orders[orderIndex].sex == 1) {
                            order_seat_sex = 'b';
                        }
                        var statusChar = '';
                        if(orders[orderIndex].status == 1)
                        {
                            statusChar = 'b';
                        }
                        else if(orders[orderIndex].status == 2)
                        {
                            statusChar = 's';
                        }
                        else if(orders[orderIndex].status == 3)
                        {
                            statusChar = 'l';
                        }

                        if (orders[orderIndex].sex == 1) {
                            statusChar = statusChar.toUpperCase();
                        }

                        seatMapArr[orders[orderIndex].row_no*2] =
                            str.substring(0, orders[orderIndex].column_no-1)
                            + statusChar
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
                        nextDay = new Date(today.getTime() + 24 * 60 * 60 * 1000),
                        orderDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                    if(req.query.t == 'tomorrow'){
                        orderDate = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate());
                    }
                    models.seatModel.canOrder(req.params.openid, classroom.classroom_id, orderDate, function(canOrder, msg, openType, openTime, closeTime){

                        if(openType == 1){
                           var openTimeArr = openTime.split(':'),
                               closeTimeArr = closeTime.split(':');
                           openTime = openTimeArr[0]+':'+openTimeArr[1],
                           closeTime = closeTimeArr[0]+':'+closeTimeArr[1];
                        }

                        res.render('./seat/libraryClassroomView', {
                            openid: req.params.openid,
                            title: classroom['full_name'],
                            classroom: classroom,
                            map: seatMapArr,
                            cid: req.params.cid,
                            today: today,
                            nextDay: nextDay,
                            type: req.query.t,
                            canOrder:canOrder,
                            msg:msg,
                            openType:openType,
                            openTime:openTime,
                            closeTime:closeTime
                        });
                    });
                }
            });
        }
    });

});

router.post('/libraryClassroom/seat/status', function(req, res) {

    models.seatModel.checkOrderBySeatCode(req.body.classroomID, req.body.seatCode, req.body.type, function (err, seatOrders) {
        var seatStatus = 0;
        var orderID = 0;
        if(seatOrders.length > 0){
            seatStatus = seatOrders[0].status;
            orderID = seatOrders[0].order_id;
        }
        models.seatModel.getLogByDateType(req.body.classroomID, req.body.seatCode, req.body.type, function (err, seatLogs) {
            for (var index = 0; index < seatLogs.length; index++) {
                seatLogs[index].log_time = (seatLogs[index].log_time.getMonth() + 1) + '-' + seatLogs[index].log_time.getDate() + ' ' + seatLogs[index].log_time.getHours() + ':' + seatLogs[index].log_time.getMinutes();
                //seatLogs[index].log_time.toLocaleString('en-US', {hour12:false});
            }
            var canOrder = req.body.canOrder;
            if(orderID > 0){
                canOrder = 0;
            }
            res.send(canOrder+"#"+seatStatus+"#"+JSON.stringify(seatLogs));
        });
    });

    /*models.seatModel.getLogByDateType(req.body.classroomID, req.body.seatCode, req.body.type, function (err, seatLogs) {
        for(var index = 0; index < seatLogs.length; index++){
            seatLogs[index].log_time = (seatLogs[index].log_time.getMonth()+1)+'月'+seatLogs[index].log_time.getDate()+ '日 ' + seatLogs[index].log_time.getHours() + '点' +seatLogs[index].log_time.getMinutes();
            //seatLogs[index].log_time.toLocaleString('en-US', {hour12:false});
        }
        res.send(JSON.stringify(seatLogs));
    });*/
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

    models.seatModel.tryCreateLibraryOrder(req.body.type, req.body.openid, req.body.classroom, req.body.seatCode, req.body.row, req.body.column, 'order', function (err, scheduleRecoverTime) {
        // 此学生有其他座位
        if (err)
        {
            if (err.type == 'prompt') {
                var promptMsg = err.message;
                res.send(promptMsg);
            }else if(err.code == 'ER_DUP_ENTRY'){
                res.send('哎呀, 就在上一秒这个座位被其他小伙伴约去了, 咱们来重新选一个位子吧');
            }else{
                res.send('哎呀, 出错了, 咱们再来一次试试, 如果还不行, 请将错误信息截图并通过订阅号发给我');
            }
        }
        // 此学生没有其他座位
        else
        {
            var promptMsg = '你已成功预订座位'+req.body.seatCode+', 请于'+scheduleRecoverTime.toLocaleString('en-US', {hour12:false})+'之前扫码签到, 过时座位将被系统自动回收。';

            res.send(promptMsg);
        }
    });




    /*models.seatModel.getOrderRelatedDateByDayType(req.body.type, function (startTime, endTime, scheduleRecoverTime) {
        models.seatModel.isValidLibraryOrderRequest(req.body.openid, req.body.classroom, req.body.seatCode, startTime, endTime, function (err) {
            if (err) {
                res.send(err.message);
            } else {
                models.seatModel.createOrder(req.body.openid, req.body.classroom, req.body.seatCode, req.body.row, req.body.column, startTime, endTime, scheduleRecoverTime,
                    function (err, newOrderId) {
                        if (err) {
                            if(err.code == 'ER_DUP_ENTRY'){
                                res.send('哎呀, 就在上一秒这个座位被其他小伙伴约去了, 咱们来重新选一个位子吧');
                            }else{
                                res.send('哎呀, 出错了, 咱们再来一次试试, 如果还不行, 赶紧找管理员2858212885@qq.com');
                            }
                        } else {
                            res.send('你已成功预订座位'+req.body.seatCode+', 请于'+scheduleRecoverTime.toLocaleString('en-US', {hour12:false})+'之前扫码签到, 过时座位将被系统自动回收。');
                        }
                    });
            }
        });
    });*/
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
    models.seatModel.leave(req.body.orderID, req.body.openid, true, function (err, results) {
        if (err) {
            res.send('设置暂离失败，请重试');
        } else {
            res.send('设置暂离成功');
        }
    });
});

router.get('/leave/:openid', function(req, res){
    var openid = req.params.openid;
    models.seatModel.getActiveLibrary(openid, function(err, orders){
        if
        (orders.length > 0)
        {
            /*当前为预约的 提示请先签到*/
            if(orders[0].status == 1)
            {
                var promptMsg = '你的座位尚未签到, 请先到现场扫码签到。';

                models.seatModel.getLog(orders[0].classroom_id, orders[0].seat_code, function (err, seatLogs) {

                    res.render('./seat/scanSeatView',
                        {
                            openid: openid,
                            title: '座位状态',
                            statusType: 'ordered',
                            classroom: orders[0].full_name,
                            seat: orders[0].seat_code,
                            orderID:orders[0].order_id,
                            seatLogs: seatLogs,
                            promptMsg: promptMsg
                        });
                });
            }
            /*当前为签到的 可执行暂离*/
            else
            if (orders[0].status == 2){
                models.seatModel.leave(orders[0].order_id, openid, true, function (err, scheduleRecoverDate) {
                    var promptMsg = '感谢你遵守文明用座规范, 现已成功设置暂离, 座位将为你保留至'+scheduleRecoverDate.toLocaleTimeString('en-US', {hour12:false})+
                        ', 请于此时间之前返回扫码签到, 否则座位将会被系统回收。';
                    models.seatModel.getLog(orders[0].classroom_id, orders[0].seat_code, function (err, seatLogs) {
                        res.render('./seat/scanSeatView',
                            {
                                openid: openid,
                                title: '座位状态',
                                statusType: 'leaved',
                                classroom: orders[0].full_name,
                                seat: orders[0].seat_code,
                                orderID:orders[0].order_id,
                                seatLogs: seatLogs,
                                promptMsg: promptMsg
                            });
                    });
                });
            }
            /*当前为暂离的 提示已是暂离状态*/
            else
            {
                var promptMsg = '你已经执行过暂离操作, 不用再重复操作。请于'+orders[0].schedule_recover_time.toLocaleTimeString('en-US', {hour12:false})+'之前返回扫码签到, 否则座位将会被系统回收。';

                models.seatModel.getLog(orders[0].classroom_id, orders[0].seat_code, function (err, seatLogs) {

                    res.render('./seat/scanSeatView',
                        {
                            openid: openid,
                            title: '座位状态',
                            statusType: 'leaved',
                            classroom: orders[0].full_name,
                            seat: orders[0].seat_code,
                            orderID:orders[0].order_id,
                            seatLogs: seatLogs,
                            promptMsg: promptMsg
                        });
                });
            }
        }
        else{
            res.render('./messageView',
                {
                    title:'暂离失败',
                    message:'你今天没有预约座位, 不能执行暂离操作。',
                    openid:openid
                });
        }
    });
});

/**
 * 历史座位
 *
 * */
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
            /*weixinAPIClient.oAuthClient.getUser({openid: openid, lang: "zh_CN"}, function (err, result) {

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
            });*/
            if(!openid)
            {
                res.render('indexView', {title: '七玥校园'});
            }else{
                weixinAPIClient.jsAPIClient.getUserInfo(openid, function (err, userInfo) {
                    if(!userInfo)
                    {
                        res.render('indexView', {openid: openid, title: '七玥校园', message: '请先关注七玥天使微信公众号。'});
                    }
                    else if(userInfo.subscribe == 1){
                        models.weixinMessageModel.addUserInfo(req.query.schoolID, userInfo, function (err) {
                            var url = decodeURIComponent('http://' + req.headers.host + req.originalUrl);
                            weixinAPIClient.jsAPIClient.getJSConfig(url, function (err, weiJSConfig) {

                                res.render('./seat/precheckView', {
                                    openid: openid,
                                    classroomID:req.query.cid,
                                    seat:req.query.seat,
                                    row:req.query.row,
                                    column:req.query.column,
                                    weiJSConfig: weiJSConfig,
                                    title: '座位状态'
                                });
                            });
                        });
                    }else{
                        res.render('indexView', {openid: openid, title: '七玥校园', message: '请先关注七玥天使微信公众号。'});
                    }
                });
            }
        }
    });
});

router.post('/scanseat/checkLocation', function (req, res) {
    models.classroomModel.getByID(req.body.classroomID, function(err, classroom){
        var distance = support.distance(req.body.longitude, req.body.latitude, classroom[0].longitude, classroom[0].latitude);
        log('距离:'+distance);

        models.userModel.getUser(req.body.openid, function(err, user){
            if(distance <= 300 || user[0].gps_exception_== 1){
                var angelCode = support.random(5);

                models.userModel.setAngelCode(req.body.openid, angelCode, function(err, result){
                    var result = {retcode:1, angelcode:angelCode, message:distance};
                    res.send(result);
                });
            }else{
                //var result = {retcode:-1, angelcode:'', message:'你所在区域不在规定的地理区域内('+distance+'), 你可切换至校园网ncepu-student试一下, 如仍有问题请到图书馆楼307房间找陈老师解决, 联系电话010-61773253。'};
                //res.send(result);
                var angelCode = support.random(5);
                models.userModel.setAngelCode(req.body.openid, angelCode, function(err, result){
                    var result = {retcode:1, angelcode:angelCode, message:distance};
                    res.send(result);
                });
            }
        });
    });
});

router.get('/scanseat/seatoperation', function(req, res){

    var openid = req.query.openid;

    models.userModel.getUser(openid, function(err, user){
        if(user[0].angelcode != req.query.angelcode)
        {
            res.render(
                './messageView',
                {
                    title:'非法请求',
                    message:'非法请求, 如继续使用此方式, 你将被加入黑名单, 拒收你的一切请求。',
                    openid:openid
                });
        }
        else
        {
            models.userModel.setAngelCode(openid, '', function(err, result){

            });

            // 检索该座位是否有人预约
            models.seatModel.checkOrderBySeatCode(req.query.cid, req.query.seat, 'today', function (err, seatOrders) {
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
                                var statusType = 'signed-others';
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
                            models.seatModel.leave(seatOrders[0].order_id, openid, true, function (err, scheduleRecoverDate) {
                                var promptMsg = '感谢你遵守文明用座规范, 现已成功设置暂离, 座位将为你保留至'+scheduleRecoverDate.toLocaleTimeString('en-US', {hour12:false})+
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
                        // 不是本人的座位，将座位设置暂离
                        else {
                            models.seatModel.leave(seatOrders[0].order_id, openid, false, function (err, scheduleRecoverDate) {
                                var promptMsg = '该座位已成功设置暂离, 座位保留至'+scheduleRecoverDate.toLocaleTimeString('en-US', {hour12:false})+
                                    '过时由系统回收。';
                                models.seatModel.getLog(req.query.cid, req.query.seat, function (err, seatLogs) {
                                    res.render('./seat/scanSeatView',
                                        {
                                            openid: openid,
                                            title: '座位状态',
                                            statusType: 'leaved-others',
                                            classroom: seatOrders[0].full_name,
                                            seat: req.query.seat,
                                            orderID:-1,
                                            seatLogs: seatLogs,
                                            promptMsg: promptMsg
                                        });
                                });
                            });
                        }
                    }
                }
                // 无人预约
                else
                {
                    models.seatModel.tryCreateLibraryOrder('today', openid, req.query.cid, req.query.seat, req.query.row, req.query.column, 'scene', function (err, newOrderId) {
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
                                                statusType: 'prompt-empty',
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
                            var promptMsg = '你已成功选座, 请遵守座位使用规则, 暂离请扫码(如未扫码暂离, 其它同学可扫码设置暂离, 你将被记录违规一次), 用完请退座。';
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
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;