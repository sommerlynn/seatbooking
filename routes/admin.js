/**
 * Created by Administrator on 2016/6/13.
 */
var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    xlsx = require('node-xlsx'), // https://github.com/mgcrea/node-xlsx
    models = require('../models'),
    debug = require('debug'),
    log = debug('index'),
    weixinAPIClient = models.weixinClient.getInstance('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

/**
 * 管理员教室列表
 * 2016-06-13 CHEN PU 创建
 *
 * */
router.get('/0125/:openid', function(req, res){
    models.userModel.getUser(req.params.openid, function(err, user){
        models.classroomModel.getAllActiveLibrary(user[0].school_id, function (err, classroomList) {
            res.render('./0125/classroomListView', {
                openid: req.params.openid,
                title: '阅览室列表',
                classroomList:classroomList
            }); 
        });
    });
});

/**
 * 管理员教室座位管理
 * 2016-06-13 CHEN PU 创建
 *
 * */
router.get('/0125/libraryClassroom/:cid/:openid', function(req, res){
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

                        res.render('./0125/libraryClassroomView', {
                            openid: req.params.openid,
                            title: classroom['full_name'],
                            classroom: classroom,
                            map: seatMapArr,
                            cid: req.params.cid,
                            today: today,
                            nextDay: nextDay,
                            type: req.query.t,
                            canOrder:1,
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

module.exports = router;