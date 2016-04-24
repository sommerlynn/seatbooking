/**
 * Created by Administrator on 2016/4/15.
 */

var seat = {},
    db = require('./db');

seat.newOrder = function(openid, classroomID, row, column, seatCode, startTime, endTime, scheduleRecoverTime,callback){

    //检查该用户是否已有此教室的活动订阅
    //图书馆类型的教室 图书馆内 只能订一个座位
    //其他类型的教室 同一个教室只能定一个座位 可以最多定6个不同教室的位子
    var selectQuery = "select * from user_seat_order_view where openid = ? "+
            "and classroom_id = ? and start_time = ? and status > 0",
        selectParams = [openid, classroomID, startTime];

    db.executeQuery(selectQuery, selectParams, function (err, results) {
        if(err){
            callback(err);
        }else if(results.length > 0){
            callback('不能太贪心哦，你已经有一个位子了(座位号:'+ results[0].seat_code +'), 让我们把这个位子留给其他小伙伴好不好');
        }
        else{
            selectQuery = "select * from area_classroom where classroom_id = ?";
            selectParams = [classroomID];

            db.executeQuery(selectQuery, selectParams, function (err, classroomInfo) {
                if(err){
                    callback(err);
                }else{

                    if(classroomInfo[0].classroom_type_name == '图书馆'){
                        selectQuery = "select * from user_seat_order_view where openid = ? "+
                            "and classroom_type_name = ? and start_time = ? and status > 0";
                        selectParams = [openid, '图书馆', startTime];

                        db.executeQuery(selectQuery, selectParams, function (err, results) {
                            if(err){
                                callback(err);
                            }else if(results.length > 0){
                                callback('不能太贪心哦，你在图书馆已经有一个位子了('+results[0].full_name + ' ' +results[0].seat_code +'号), 让我们把这个位子留给其他小伙伴好不好');
                            }else{
                                var insertQuery = "insert into user_seat_order (user_id, classroom_id, row_no, column_no, seat_code, start_time, end_time, schedule_recover_time, status) values "+
                                        "((select user_id from user where openid = ?), ?, ?, ?, ?, ?, ?, ?, 1)",
                                    insertParams = [openid, classroomID, row, column, seatCode, startTime, endTime, scheduleRecoverTime];
                                db.insertQuery(insertQuery, insertParams, function(err, id){
                                    if(err){
                                        callback(err);
                                    }
                                    else{
                                        callback(null);
                                    }
                                });
                            }
                        });
                    }else{
                        selectQuery = "select * from user_seat_order_view where openid = ? "+
                            "and classroom_type_name <> ? and start_time = ? and status > 0";
                        selectParams = [openid, '图书馆', startTime];

                        db.executeQuery(selectQuery, selectParams, function (err, results) {
                            if(err){
                                callback(err);
                            }else if(results.length > 5){
                                callback('不能太贪心哦，你已经有'+results.length+'个位子了, 让我们把这个位子留给其他小伙伴好不好');
                            }else{
                                var insertQuery = "insert into user_seat_order (user_id, classroom_id, row_no, column_no, seat_code, start_time, end_time, status) values "+
                                        "((select user_id from user where openid = ?), ?, ?, ?, ?, ?, ?, 1)",
                                    insertParams = [openid, classroomID, row, column, seatCode, startTime, endTime];
                                db.insertQuery(insertQuery, insertParams, function(err, id){
                                    if(err){
                                        callback('该座位已被其他小伙伴预约，请选择其它座位');
                                    }
                                    else{
                                        callback(null);
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }
    });


};

seat.getActive = function(openid, callback) {
    var selectQuery = "select * from user_seat_order_view where openid = ? and end_time > ? and status > 0 order by start_time asc, order_time desc",
        params = [openid, new Date()];
    db.executeQuery(selectQuery, params, callback);
};

seat.release = function (orderID, callback) {
    var updateQuery = "update user_seat_order set status = -1, leave_time = ?, lock_code = ? where order_id = ?",
        params = [new Date(), orderID, orderID];
    db.executeQuery(updateQuery, params, callback);
};

/*
* 座位签到
* 2016-04-19: CHEN PU 新建
* */
seat.sign = function (orderID, callback) {
    var updateQuery = "update user_seat_order set status = 2, leave_time = ? where order_id = ?",
        params = [new Date(), orderID];
    db.executeQuery(updateQuery, params, callback);
};

/*
* 暂离座位
* 2016-04-08 CHEN PU 新建
* 2016-04-19 CHEN PU 修改status值从2变成3,2作为签到的状态
* */
seat.leave = function (orderID, callback) {
    var updateQuery = "update user_seat_order set status = 3, leave_time = ? where order_id = ?",
        params = [new Date(), orderID];
    db.executeQuery(updateQuery, params, callback);
};

/*
* 获取用户当天在某教室的座位预约单
* 2016-04-19 CHEN PU 新建
* */
seat.getMyTodayOrderWithinClassroom = function (classroomID, openid, callback){
    var selectQuery = "select * from user_seat_order_view where openid = ? and classroom_id = ? "+
                      "and start_time < ? and end_time > ? and (status = 1 or status = 3)",
        params = [openid, classroomID, new Date(), new Date()];
    db.executeQuery(selectQuery, params, callback);
};

seat.sign = function(orderID, callback){
    var updateQuery = "update user_seat_order set status = 2, sign_time = ? where order_id = ?",
        params = [new Date(), orderID];
    db.executeQuery(updateQuery, params, callback);
};

seat.getOld = function(openid, callback){
    var selectQuery = "select * from user_seat_order_view where openid = ? and (end_time < ? or status < 0) order by start_time desc, order_time desc",
        params = [openid, new Date()];
    db.executeQuery(selectQuery, params, callback);
};

module.exports = seat;