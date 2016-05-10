/**
 * Created by pchen on 2016/5/8.
 * 后台工作进程
 *
 */

var schedule = require("node-schedule"),
    debug = require('debug'),
    log = debug('worker'),
    seatModel = require('./seatModel');

var rule = new schedule.RecurrenceRule();
var minutes = [];
var hours = [];
for(var index = 0; index < 60; index++){
    minutes.push(index);
}
for(var index = 8; index < 22; index++){
    hours.push(index);
}
rule.minute = minutes;
rule.hour = hours;

schedule.scheduleJob(rule, function(){
    seatModel.getOrderNeedToRecycle(function(err, orders){
        for(var index = 0; index < orders.length; index++){
            seatModel.recycle(orders[index].order_id, function(err, result){
                //log('系统释放'+orders[index].full_name+' '+orders[index].seat_code+' '+(new Date()).toLocaleString());
            });
        }
    });
});

