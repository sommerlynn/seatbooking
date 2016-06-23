/**
 * Created by pchen on 2016/6/20.
 */
var credit = {},
    db = require('./db'),
    schoolModel = require('./schoolModel'),
    weixinMessage = require('./weixinMessageModel'),
    userModel = require('./userModel'),
    async = require('async'),
    support = require('../lib/support');

credit.log = function(orderID, userOpenid, operatorOpenid, score, logType, logMsg){
    var insertQuery = 'insert into credit_score_log (order_id, user_openid, operator_openid, score, log_type, log_msg) '+
                      'values (?,?,?,?,?,?)',
        insertParams = [orderID, userOpenid, operatorOpenid, score, logType, logMsg];
    db.executeQuery(insertQuery, insertParams, function(err, result){

    });
};

/**
 * 更新用户的信用分
 * 2016-06-20 CHEN PU 创建
 *
 * */
credit.updateScore = function(openid, score, reasonMsg, callback){
    var updateQuery = 'update user set credit_score = credit_score + ? where openid = ?',
        updateParams = [score, openid];
    db.executeQuery(updateQuery, updateParams, function(err, result){
        userModel.getUser(openid, function(err, userInfo){
            weixinMessage.noticeCreditScore(openid, reasonMsg, score, userInfo[0].credit_score);
            callback(null);
        });
    });
};

/**
 * 计算信用分的扣减
 * 预约超时扣一分 被代暂离超时扣一分
 *
 * 2016-06-20 CHEN PU 创建
 * */
credit.calculateCreditRule = function (logID, openid, callback) {
    var now = new Date(),
        todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    var updateQuery = 'update seat_log set credit_status = 1 where log_id = ?',
        updateParams = [logID];
    db.executeQuery(updateQuery, updateParams, function (err, result) {
        var selectQuery = "select * from seat_log_view where original_openid = ? and order_date = ? and log_id < ? order by log_id desc limit 1",
            selectParams = [openid, todayDate, logID]
        db.executeQuery(selectQuery, selectParams, function (err, results) {
            // 预约导致的超时 扣1分
            if (results[0].log_type == 1) {
                var reasonMsg = '预约未按时签到';
                credit.updateScore(results[0].original_openid, -2, reasonMsg, function(err, result){
                    credit.log(results[0].order_id, results[0].original_openid, '0101010101', -2, 1, reasonMsg);
                    callback(null);
                });

            }
            // 暂离导致的超时
            else
            {
                // 自己设置暂离 超时不扣分 被管理员或他人设置暂离 超时扣2分
                if (results[0].original_openid != results[0].openid) {
                    var reasonMsg = '离开未设暂离且超时未归';
                    credit.updateScore(results[0].original_openid, -2, reasonMsg, function(err, result){
                        credit.log(results[0].order_id, results[0].original_openid, '0101010101', -2, 2, reasonMsg);
                        callback(null);
                    });
                }
                else{
                    callback(null);
                }
            }
        });
    });
};

module.exports = credit;