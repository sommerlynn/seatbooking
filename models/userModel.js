/**
 * Created by pchen on 2016/1/2.
 */

var user = {},
    db = require('./db');

user.getUser = function(openid, callback){
     var selectQuery = "select * from user_info_view where openid = ?",
         params = [openid];
    db.executeQuery(selectQuery, params, callback);
};

user.fillRealInfo = function (realName, userCode, departmentName, className, openid, callback) {
    var updateQuery = "update user set real_name = ?, user_code = ?, "+
                      "department_id = (select department_id from department where department_name = ?),"+
                      "class_id = (select class_id from class where class_name = ?) "+
                      "where openid = ?",
        params = [realName, userCode, departmentName, className, openid];
    db.executeQuery(updateQuery, params, callback);
};

module.exports = user;