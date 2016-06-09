/**
 * Created by pchen on 2016/5/15.
 */


var arbitration = {},
    db = require('./db');

/**
 * 用户提交申诉请求
 *
 *
 * */
arbitration.new = function(applier_openid, classroom_full_name, seat_code, description, callback){
    var insertQuery = "insert into arbitration (applier_openid, classroom_id, seat_code, description) VALUES (?, (select classroom_id from area_classroom_view where full_name = ? ), ?, ?)",
        params = [applier_openid,classroom_full_name,seat_code,description];
    db.executeQuery(insertQuery, params, callback);
};

/**
 * 获取指定管理员所管理阅览室的申诉请求
 * 2016-06-09： CHEN PU 创建
 */
arbitration.listNew = function(openid, callback){
    var selectQuery = 'select * from arbitration_view where classroom_id in '+
        '(select classroom_id in classroom_manager left join user on classroom_manager.user_id = user.user_id where open_id = ?)',
        selectParams = [openid];
    db.executeQuery(selectQuery, selectParams, callback);
};

module.exports = arbitration;
