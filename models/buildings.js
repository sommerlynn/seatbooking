/**
 * Created by pchen on 2015/12/1.
 */

var buildings = {},
    db = require('./db');

buildings.getAll = function(schoolID, callback){
  var selectQuery = "select * from building_area_view where school_id = ?",
      params = [schoolID];
  db.executeQuery(selectQuery, params, callback);
};

module.exports = buildings;