/**
 * Created by Administrator on 2016/4/15.
 */

var seat = {},
    db = require('./db');

seat.newOrder = function(openid, classroomID, row, column, seatCode, startTime, endTime, callback){
    //检查该用户是否已有此教室的活动订阅
    var selectQuery = "select 1 from user_seat_order_view where openid = ? "+
            "and classroom_id = ? and start_time = ? and status > 0",
        selectParams = [openid, classroomID, startTime];

    db.executeQuery(selectQuery, selectParams, function (err, results) {
        if(err){
            callback(err);
        }else if(results.length > 0){
            callback('你已在该教室订了其它座位，一人一天在同一教室只能订一个座位，请遵守《座位使用文明公约》。');
        }
        else{
            var insertQuery = "insert into user_seat_order (user_id, classroom_id, row_no, column_no, seat_code, start_time, end_time, status) values "+
                    "((select user_id from user where openid = ?), ?, ?, ?, ?, ?, ?, 1)",
                insertParams = [openid, classroomID, row, column, seatCode, startTime, endTime];
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


};

seat.getActive = function(openid, callback) {
    var selectQuery = "select * from user_seat_order_view where openid = ? and end_time > ? and status > 0 order by start_time",
        params = [openid, new Date()];
    db.executeQuery(selectQuery, params, callback);
};

seat.release = function (orderID, callback) {
    var updateQuery = "update user_seat_order set status = -1, leave_time = ? where order_id = ?",
        params = [new Date(), orderID];
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
                      "and start_time < ? and end_time ? and (status = 1 or status = 3)",
        params = [openid, classroomID, new Date(), new Date()];
    db.executeQuery(selectQuery, params, callback);
};

module.exports = seat;