/**
 * Created by pchen on 2016/5/8.
 * 后台工作进程
 *
 */

var schedule = require("node-schedule"),
    debug = require('debug'),
    log = debug('worker');

var rule = new schedule.RecurrenceRule();
var minutes = [];
for(var index = 0; index < 60; index++){
    minutes.push(index);
}
rule.minute = minutes;

schedule.scheduleJob(rule, function(){
    log('worker');
});


