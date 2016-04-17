/**
 * Created by Administrator on 2016/4/11.
 */

var departmentClass = {},
    db = require('./db');

departmentClass.getActiveDepartments = function(type, callback){
    var selectQuery = "select * from department where is_active = 1 order by department_name",
        params = [];
    db.executeQuery(selectQuery, params, callback);
};

departmentClass.getClass = function (departmentName, callback) {
    var selectQuery = "select * from class where department_id = "+
                      "(select department_id from department where department_name = ?) order by class_name",
        params = [departmentName];
    db.executeQuery(selectQuery, params, callback);
};
module.exports = departmentClass;