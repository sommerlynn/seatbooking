/**
 * Created by pchen on 2015/12/1.
 */

var classroom = {},
    db = require('./db');

classroom.getAll = function(schoolID, callback){
  var selectQuery = "select * from area_classroom where area_status = 1",
      params = [schoolID];
  db.executeQuery(selectQuery, params, callback);
};

classroom.getByID = function(classroomID, callback){
  var selectQuery = "select * from area_classroom where classroom_id = ?",
      params = [classroomID];
  db.getObject(selectQuery, params, callback);
};

classroom.getByAreaID = function (areaID, callback) {
  var selectQuery = "select * from classroom_today_order_detail_view where area_id = ? order by classroom_name",
      params = [areaID];
  db.executeQuery(selectQuery, params, callback);
};

classroom.getOrder = function (classroomID, orderDate, callback) {
  var selectQuery = "select * from user_seat_order_view where start_time < ? and end_time > ? and classroom_id = ?",
      params = [orderDate, orderDate, classroomID];
  db.executeQuery(selectQuery, params, callback);
};

module.exports = classroom;