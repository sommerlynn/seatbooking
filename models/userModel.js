/**
 * Created by pchen on 2016/1/2.
 */

var user = {},
    db = require('./db');

user.order = function(openid, classroomID, row, column, startTime, endTime, callback){
    var insertQuery = "insert into user_seat_order (user_id, classroom_id, row_no, column_no, start_time, end_time) values "+
                      "((select user_id from user where openid = ?), ?, ?, ?, ?, ?)",
        params = [openid, classroomID, row, column, startTime, endTime];
    db.insertQuery(insertQuery, params, function(err, id){
        if(err){
            callback(err);
        }
        else{
            callback(null);
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