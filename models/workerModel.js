/**
 * Created by pchen on 2016/5/8.
 * 后台工作进程
 *
 */

var worker = {},
    schedule = require("node-schedule"),
    debug = require('debug'),
    log = debug('worker'),
    seatModel = require('./seatModel'),
    classroomModel = require('./classroomModel'),
    weixinMessageModel = require('./weixinMessageModel'),
    creditModel = require('./creditModel'),
    async = require('async'),
    db = require('./db');

var seatRule = new schedule.RecurrenceRule();
var seatMinutes = [];
var seatHours = [];
for(var index = 0; index < 60; index++){
    seatMinutes.push(index);
}
for(var index = 8; index < 22; index++){
    seatHours.push(index);
}
seatRule.minute = seatMinutes;
seatRule.hour = seatHours;

var recycleSeatWorkerBusy = 0,
    noticeOrderWorkerBusy = 0,
    calculateCreditScoreBusy = 0;

/**
 *
 * 2016-06-22 CHEN PU 修改后台工作进程 增加日志记录 和 工作线程状态判断
 *
 *
 * */
schedule.scheduleJob(seatRule, function(){
    if(recycleSeatWorkerBusy != 1){
        recycleSeatWorkerBusy = 1;

        worker.log('回收座位','开始');

        seatModel.getOrderNeedToRecycle(function(err, orders){
            async.forEachSeries(orders, function(item, callback){
                seatModel.sysReleaseAsNotSign(item.order_id, callback);
                worker.log('回收座位',item.order_id+' '+item.full_name+' '+item.seat_code+ ' '+item.openid);
            }, function () {
               recycleSeatWorkerBusy = 0;
               worker.log('回收座位','完成');
            });
        });
    }

    if(noticeOrderWorkerBusy != 1){
        noticeOrderWorkerBusy = 1;
        worker.log('发送座位回收提醒通知','开始');
        seatModel.getOrderNeedToNotice(function (err, orders) {
            async.forEachSeries(orders, function(item, callback){
                weixinMessageModel.willRecycleNotice(item.openid, item.school_id, item.full_name, item.seat_code, item.schedule_recover_time);
                worker.log('发送座位回收提醒通知',item.order_id+' '+item.full_name+' '+item.seat_code+' '+item.openid, callback);
            }, function () {
               noticeOrderWorkerBusy = 0;
               worker.log('发送座位回收提醒通知','完成');
            });
        });
    }

    if(calculateCreditScoreBusy != 1){
        calculateCreditScoreBusy = 1;
        worker.log('计算信用分','开始');
        seatModel.getLogNeedToCalculateCreditScore(function(err, logs){
            async.forEachSeries(logs, function(item, callback){
                creditModel.calculateCreditRule(item.log_id, item.original_openid);
                worker.log('计算信用分',item.log_id+' '+item.order_id+' '+item.full_name+' '+item.seat_code + ' ' + item.original_openid);
                callback(null);
            }, function () {
               calculateCreditScoreBusy = 0;
               worker.log('计算信用分','完成');
            });
        });
    }
});

/**
 * 每天0点计算次日教室课程时间 填充classroom_time表
 * 格式 * * * * * Minute(0-59), hour(0-23), date of Month (1-31), Month(1-12), day of week (0-7)
 * 2016-06-05 CHEN PU 创建
 *
 * */
//schedule.scheduleJob('1 0 * * *', function(){
schedule.scheduleJob('10 12 * * *', function(){
    var now = new Date(),
        nextDay = new Date(now.getTime()+ 24 * 60 * 60 * 1000),
        nextDayDate = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 12, 0);
    classroomModel.getByType(1, '普通排课教室', function(err, classroomList){
        worker.log('教室课程安排数据处理','开始');
        async.forEachSeries(classroomList,
            function (item, callback) {
                classroomModel.insertClassTimeItem(1, item.classroom_id, nextDayDate, callback);
            },
            function () {
                worker.log('教室课程安排数据处理','完成');
            }
        );
    });
});

worker.log = function (workerType, logType, callback) {
    var insertQuery = 'insert into worker_log (worker_type, log_type) values (?, ?)',
        insertParams = [workerType, logType];
    db.executeQuery(insertQuery, insertParams, callback);
};

module.exports = worker;


