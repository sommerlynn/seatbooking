/**
 * Created by pchen on 2016/1/2.
 */

var user = {},
    db = require('./db'),
    weixinMessage = require('./weixinMessageModel');

user.getUser = function(openid, callback){
     var selectQuery = "select * from user_info_view where openid = ?",
         params = [openid];
    db.executeQuery(selectQuery, params, callback);
};

user.fillRealInfo = function (realName, userCode, departmentName, className, openid, personType, verifyImage, callback) {
    var updateQuery = "update user set real_name = ?, user_code = ?, "+
                      "department_id = (select department_id from department where department_name = ?),"+
                      "class_id = (select class_id from class where class_name = ?), "+
                      "type = ?, verify_date = ?, verify_image = ?, status = 1 "+
                      "where openid = ?",
        params = [realName, userCode, departmentName, className, personType, new Date(), verifyImage, openid];
    db.executeQuery(updateQuery, params, callback);
};

/**
 * 获取指定用户的管理者（如辅导员、班主任等）
 */
user.getManager = function(openid, callback){
    var selectQuery = "select * from class_manager_user_view where manager_class_id in (select class_id from user where openid = ?)",
        params = [openid];
    db.executeQuery(selectQuery, params, callback);
};

/**
 * 验证码 防止同一链接被复用多次
 *
 * */
user.setAngelCode = function(openid, angelcode, callback){
    var updateQuery = "update user set angelcode = ? where openid = ?",
        params = [angelcode, openid];
    db.executeQuery(updateQuery, params, callback);
};

/**
 * 获取待审批的实名认证列表
 *
 * */
user.getWaitForConfirmList = function(callback){
    var selectQuery = 'select * from user_info_view where status = 1 order by last_modified',
        selectParams = [];
    db.executeQuery(selectQuery, selectParams, callback);
};

/**
 * 通过用户审核
 *
 * */
user.passVerification = function(applierOpenid, adminOpenid, callback){
   var updateQuery = 'update user set status = 2, approve_by = ?, approve_date = ? where openid = ?',
       updateParams = [adminOpenid, new Date(), applierOpenid];
    db.executeQuery(updateQuery, updateParams, function(err, results){
       if(err){
           callback(err);
       } else{
           weixinMessage.passVerification(applierOpenid);
           callback(null, results);
       }
    });
};

/**
 * 驳回用户审核
 * 2016-06-13 CHEN PU 创建
 *
 * */
user.rejectVerification = function(applierOpenid, rejectMsg, callback){
    var updateQuery = 'update user set status = 0 where openid = ?',
        updateParams = [applierOpenid];
    db.executeQuery(updateQuery, updateParams, function(err, results){
        if(err){
            callback(err);
        } else{
            weixinMessage.rejectVerification(applierOpenid, rejectMsg);
            callback(null, results);
        }
    });
};

module.exports = user;