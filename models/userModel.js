/**
 * Created by pchen on 2016/1/2.
 */

var user = {},
    db = require('./db');

user.newOrder = function(openid, classroomID, row, column, seatCode, startTime, endTime, callback){
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

user.getUser = function(){

};

user.getSeatActiveOrderSheet = function(openid, callback) {
    var selectQuery = "select * from user_seat_order_view where openid = ? and end_time > ? and status > 0 order by start_time",
        params = [openid, new Date()];
    db.executeQuery(selectQuery, params, callback);
};

user.releaseSeat = function (orderID, callback) {
    var updateQuery = "update user_seat_order set status = -1, leave_time = ? where order_id = ?",
        params = [new Date(), orderID];
    db.executeQuery(updateQuery, params, callback);
};

user.leaveSeat = function (orderID, callback) {
    var updateQuery = "update user_seat_order set status = 2, leave_time = ? where order_id = ?",
        params = [new Date(), orderID];
    db.executeQuery(updateQuery, params, callback);
};

user.fillRealInfo = function (openid, realName, userCode, departmentName, className, callback) {
    var updateQuery = "update user set real_name = ?, user_code = ?, "+
                      "department_id = (select department_id from department where department_name = ?),"+
                      "class_id = (select class_id from class where class_name = ?)"+
                      "where open_id = ?",
        params = [realName, userCode, departmentName, className, openid];
    db.executeQuery(updateQuery, params, callback);
};
module.exports = user;