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
      parms = [classroomID];
  db.getObject(selectQuery, parms, callback);
};

module.exports = classroom;