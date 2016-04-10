/**
 * Created by Administrator on 2016/4/11.
 */

var departmentClass = {},
    db = require('./db');

departmentClass.getActiveDepartments = function(callback){
    var selectQuery = "select * from department where is_active = 1",
        params = [];
    db.executeQuery(selectQuery, params, callback);
};

departmentClass.getClass = function (departmentName, callback) {
    var selectQuery = "select * from class where department_id = "+
                      "(select department_id from departments where department_name = ?)",
        params = [departmentName];
    db.executeQuery(selectQuery, params, callback);
};
module.exports = departmentClass;