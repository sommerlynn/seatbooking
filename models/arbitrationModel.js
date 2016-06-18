/**
 * Created by pchen on 2016/5/15.
 */


var arbitration = {},
    db = require('./db'),
    weixinMessage = require('./weixinMessageModel'),
    classroomModel = require('./classroomModel'),
    async = require('async');

/**
 * 用户提交申诉请求
 *
 *
 * */
arbitration.new = function(applier_openid, classroom_full_name, seat_code, description, callback){
    var insertQuery = "insert into arbitration (applier_openid, classroom_id, seat_code, description) VALUES (?, (select classroom_id from area_classroom_view where full_name = ? ), ?, ?)",
        params = [applier_openid,classroom_full_name,seat_code,description];
    //results.insertId
    db.executeQuery(insertQuery, params, function (err, results) {
        if(err){
            callback(null);
        }else{
            classroomModel.getManager(classroom_full_name, function(err, managers){
                async.forEachSeries(managers, function(item, callback2){
                    weixinMessage.noticeClassManagerArbitration(item.user_openid, classroom_full_name+' '+seat_code+' '+description);
                    callback2(null);
                });

            });
            callback(err, results);   
        }        
    });
};

/**
 * 获取指定管理员所管理阅览室的申诉请求
 * 2016-06-09： CHEN PU 创建
 */
arbitration.listNew = function(openid, callback){
    var selectQuery = 'select * from arbitration_view where classroom_id in '+
        '(select classroom_id from classroom_manager left join user on classroom_manager.user_openid = user.openid where openid = ?) and status = 1',
        selectParams = [openid];
    db.executeQuery(selectQuery, selectParams, callback);
};

/**
 * 获取指定管理员所管理阅览室的已处理的申诉请求
 * 2016-06-10： CHEN PU 创建
 */
arbitration.listOld = function(openid, callback){
    var selectQuery = 'select * from arbitration_view where classroom_id in '+
            '(select classroom_id from classroom_manager left join user on classroom_manager.user_openid = user.openid where openid = ?) and status <> 1',
        selectParams = [openid];
    db.executeQuery(selectQuery, selectParams, callback);
};

/**
 * 获取指定的申诉请求
 * 2016-06-10： CHEN　PU 创建
 * */
arbitration.get = function(arbitrationID, callback){
    var selectQuery = 'select * from arbitration_view where arbitration_id = ? ',
        selectParams = [arbitrationID];
    db.executeQuery(selectQuery, selectParams, callback);
};

/**
 * 处理申诉请求
 * 2016-06-10: CHEN PU 创建
 *
 * */
arbitration.dealWith = function(arbitrationID, operatorOpenid, operationComment, callback){
    var updateQuery = 'update arbitration set operator_openid = ?, operate_date = ?, operate_comment = ?, status = 2 where arbitration_id = ?',
        updateParams = [operatorOpenid, new Date(), operationComment, arbitrationID];

    arbitration.get(arbitrationID, function (err, result) {
        weixinMessage.dealWithArbitration(result[0].applier_openid, operationComment);
    });

    db.executeQuery(updateQuery, updateParams, callback);
};

module.exports = arbitration;
