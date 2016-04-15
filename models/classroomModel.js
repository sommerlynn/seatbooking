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

classroom.getOrder = function (classroomID, dayType, callback) {
  var orderDate = new Date();
  if(dayType == 'tomorrow'){
      orderDate = new Date(orderDate.getTime()+24*60*60*1000);
  }

  var selectQuery = "select * from user_seat_order_view where start_time < ? and end_time > ? and classroom_id = ? and status > 0",
      params = [orderDate, orderDate, classroomID];
  db.executeQuery(selectQuery, params, callback);
};

classroom.getActiveOrder = function (classroomID, dayType, callback) {
    var orderDate = new Date();
    if(dayType == 'tomorrow'){
        orderDate = new Date(orderDate.getTime()+24*60*60*1000);
    }

    var selectQuery = "select * from user_seat_order_view where start_time < ? and end_time > ? and classroom_id = ? and status > 0",
        params = [orderDate, orderDate, classroomID];
    db.executeQuery(selectQuery, params, callback);
};

classroom.getToday = function(classroomID, callback){
  var selectQuery = "select * from classroom_today_order_detail_view where classroom_id = ?",
      params = [classroomID];
  db.getObject(selectQuery, params, callback);
};

classroom.getNextday = function(classroomID, callback){
  var selectQuery = "select * from classroom_nextday_order_detail_view where classroom_id = ?",
      params = [classroomID];
  db.getObject(selectQuery, params, callback);
};

classroom.getOrderByDayType = function(classroomID, dayType, callback){
  if(dayType == 'tomorrow'){
      classroom.getNextday(classroomID, callback);
  }else{
      classroom.getToday(classroomID, callback);
  }
};

classroom.buildSeatMap = function(classroom, callback){
    var row_count = classroom.row_count;
    var column_count = classroom.column_count;
    var seatmap = '';
    for(var rindex = 0; rindex < row_count; rindex++){
      for(var cindex = 0; cindex < column_count; cindex++){
        seatmap = seatmap+'a';
      }
      seatmap = seatmap+';';
    }

    var updateQuery = 'update classroom set seat_map = ? where classroom_id = ?',
        params = [seatmap, classroom.classroom_id];
    db.executeQuery(updateQuery, params, function(err, results){
      if(err){
        callback(err);
      }
      else{
        callback(null);
      }
    });
};

module.exports = classroom;