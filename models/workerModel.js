/**
 * Created by pchen on 2016/5/8.
 * 后台工作进程
 *
 */

var schedule = require("node-schedule"),
    debug = require('debug'),
    log = debug('worker'),
    seatModel = require('./seatModel'),
    classroomModel = require('./classroomModel');
    async = require('async');

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

schedule.scheduleJob(seatRule, function(){
    seatModel.getOrderNeedToRecycle(function(err, orders){
        async.forEachSeries(orders, function(item, callback){
            seatModel.sysReleaseAsNotSign(item.order_id, callback);
                //log('系统释放'+orders[index].full_name+' '+orders[index].seat_code+' '+(new Date()).toLocaleString());
                /*seatModel.getQueue(item.classroom_id, item.seat_code, function(err, queueOrders){
                 async.forEachSeries(queueOrders, function(queueOrder){
                 seatModel.isValidLibraryOrderRequest(queueOrder.openid, queueOrder.classroom_id, queueOrder.seat_code,
                 queueOrder.start_time, queueOrder.end_time, function(err, result){
                 if(err){

                 }else{
                 seatModel.sign(queueOrder.order_id, function(err, result){

                 });
                 }
                 });
                 });
                 });*/

        });
    });
});


var classroomRule = new schedule.RecurrenceRule();
var classroomMinutes = [55,56,57];
var classroomHours = [16];
classroomRule.minute = classroomMinutes;
classroomRule.hour = classroomHours;

schedule.scheduleJob('08 20 * * *', function(){
    var now = new Date(),
        nextDay = new Date(now.getTime()+24 * 60 * 60 * 1000),
        nextDayDate = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate());
    classroomModel.getByType(1, '普通排课教室', function(err, classroomList){
        async.forEachSeries(classroomList,
            function (item, callback) {
                classroomModel.insertClassTimeItem(1, item.classroom_id, nextDayDate, callback);
            },
            function (err) {

            }
        );
    });
});


