/**
 * Created by pchen on 2016/6/20.
 */
var credit = {},
    db = require('./db'),
    schoolModel = require('./schoolModel'),
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
credit.updateScore = function(openid, score){
    var updateQuery = 'update user set credit_score = credit_score + ? where openid = ?',
        updateParams = [score, openid];
    db.executeQuery(updateQuery, updateParams, function(err, result){});
};

module.exports = credit;