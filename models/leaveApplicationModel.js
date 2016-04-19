/**
 * Created by Administrator on 2016/4/15.
 */
var leaveApplication = {},
    db = require('./db');

leaveApplication.apply = function(openid, leaveReason, startTime, endTime, mobile, address, callback){
    var insertQuery = "insert into leave_application (applier_id, start_time, end_time, application_reason, mobile, address, status) "+
            "values ((select user_id from user where openid = ?), ?, ?, ?, ?, ?, 0)",
        params = [openid, startTime, endTime, leaveReason, mobile, address];
    db.executeQuery(insertQuery, params, callback);
};

leaveApplication.getActive = function (openid, callback) {
    var selectQuery = "select * from active_leave_application_view where applier_openid = ?",
        params = [openid];
    db.executeQuery(selectQuery, params, callback);
};

leaveApplication.getForApproving = function (openid, callback) {
    var selectQuery = "select * from active_leave_application_view where applier_class_id in "+
            "(select class_id from class_manager_user_view where openid = ?) and status = 0",
        params = [openid];
    db.executeQuery(selectQuery, params, callback);
};

leaveApplication.getOld = function(openid, callback){
    var selectQuery = "select * from inactive_leave_application_view where applier_openid = ?",
        params = [openid];
    db.executeQuery(selectQuery, params, callback);
};

leaveApplication.getChecked = function (openid, callback) {
    var selectQuery = "select * from all_leave_application_view where applier_class_id in "+
            "(select class_id from class_manager_user_view where openid = ?)",
        params = [openid];
    db.executeQuery(selectQuery, params, callback);
};

leaveApplication.approve = function (openid, applicationID, callback){
    var updateQuery = "update leave_application set status = 1, approve_time = NOW(), approve_by = "+
            "(select user_id from user where openid = ?) where application_id = ?",
        params = [openid, applicationID];
    db.executeQuery(updateQuery, params, callback);
};

leaveApplication.reject = function (openid, applicationID, callback) {
    var updateQuery = "update leave_application set status = -1, approve_time = NOW(), approve_by = "+
            "(select user_id from user where openid = ?) where application_id = ?",
        params = [openid, applicationID];
    db.executeQuery(updateQuery, params, callback);
};


module.exports = leaveApplication;