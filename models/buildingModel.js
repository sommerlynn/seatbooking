/**
 * Created by pchen on 2015/12/1.
 */

var buildings = {},
    db = require('./db');

buildings.getAll = function(schoolID, callback){
  var selectQuery = "select * from area_classroom where area_status = 1",
      params = [schoolID];
  db.executeQuery(selectQuery, params, callback);
};

module.exports = buildings;