/**
 * Created by pchen on 2016/1/2.
 */

var user = {},
    db = require('./db');

user.newOrder = function(openid, classroomID, row, column, startTime, endTime, callback){
    //检查该用户是否已有此教室的活动订阅
    var selectQuery = "select 1 from user_seat_order_view where openid = ? "+
                      "and classroom_id = ? and start_time = ?",
        selectParams = [openid, classroomID, startTime];

    db.executeQuery(selectQuery, selectParams, function (err, results) {
       if(err){
            callback(err);
       }else if(results.length > 0){
           callback('你已在该教室订了其它座位，一人一天在同一教室只能订一个座位，请遵守《座位使用文明公约》。');
       }
       else{
           var insertQuery = "insert into user_seat_order (user_id, classroom_id, row_no, column_no, start_time, end_time) values "+
                   "((select user_id from user where openid = ?), ?, ?, ?, ?, ?)",
               insertParams = [openid, classroomID, row, column, startTime, endTime];
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

user.getSeatOrderSheet = function(openid, callback) {
    var selectQuery = "select * from user_seat_order_view where openid = ?",
        params = [openid];
    db.executeQuery(selectQuery, params, callback);
};

module.exports = user;