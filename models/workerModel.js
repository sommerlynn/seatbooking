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
            log('order_id::'+orders[index].order_id);
            seatModel.sysReleaseAsNotSign(orders[index].order_id, function(err, result){
                //log('系统释放'+orders[index].full_name+' '+orders[index].seat_code+' '+(new Date()).toLocaleString());
                seatModel.getQueue(orders[index].classroom_id, orders[index].seat_code, function(err, queueOrders){
                    for (var rindex = 0; rindex < queueOrders.length; rindex++){
                        seatModel.isValidLibraryOrderRequest(queueOrders[index].openid, queueOrders[index].classroom_id, queueOrders[index].seat_code,
                            queueOrders[index].start_time, queueOrders[index].end_time, function(err, result){
                                if(err){

                                }else{
                                    seatModel.sign(queueOrders[index].order_id, function(err, result){

                                    });
                                }
                            });
                    }
                });
            });
        }
    });
});


