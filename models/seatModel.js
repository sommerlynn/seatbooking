/**
 * Created by Administrator on 2016/4/15.
 */

var seat = {},
    db = require('./db'),
    weixinMessage = require('./weixinMessageModel');

/**
 * 2016-04-24: CHEN PU 新增逻辑 将时间逻辑从页面逻辑移到业务逻辑
 *                     设置系统计划回收时间
 * 2016-04-28: CHEN PU 这个方法的业务逻辑后面要拆分开，图书馆和普通教室的方法各自独立，这样更清晰
 *
 * */
/*seat.newOrder = function(openid, classroomID, seatCode, dayType, callback){
    var startTime;
    var today = new Date();
    var scheduleRecoverTime =  new Date(today.getTime() + 30*60*1000);// 当天预约，需在半小时内到现场签到
    if (dayType == 'tomorrow') {
        var nextDay = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        startTime = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate());
        scheduleRecoverTime = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 8, 30);
    } else {
        startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // 八点前预约的 系统回收时间统一定为8:30
        if(today.getHours() < 8){
            scheduleRecoverTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 30);
        }
    }
    var endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

    //检查该用户是否已有此教室的活动订阅
    //图书馆类型的教室 图书馆内 只能订一个座位
    //其他类型的教室 同一个教室只能定一个座位 可以最多定6个不同教室的位子
    var selectQuery = "select * from user_seat_order_view where openid = ? "+
            "and classroom_id = ? and start_time = ? and status > 0",
        selectParams = [openid, classroomID, startTime];

    db.executeQuery(selectQuery, selectParams, function (err, results) {
        if(err){
            callback(err);
        }else if(results.length > 0){
            callback('不能太贪心哦，你已经有一个位子了(座位号:'+ results[0].seat_code +'), 让我们把这个位子留给其他小伙伴好不好');
        }
        else{
            selectQuery = "select * from area_classroom where classroom_id = ?";
            selectParams = [classroomID];

            db.executeQuery(selectQuery, selectParams, function (err, classroomInfo) {
                if(err){
                    callback(err);
                }else{

                    if(classroomInfo[0].classroom_type_name == '图书馆'){
                        selectQuery = "select * from user_seat_order_view where openid = ? "+
                            "and classroom_type_name = ? and start_time = ? and status > 0";
                        selectParams = [openid, '图书馆', startTime];

                        db.executeQuery(selectQuery, selectParams, function (err, results) {
                            if(err){
                                callback(err);
                            }else if(results.length > 0){
                                callback('不能太贪心哦，你在图书馆已经有一个位子了('+results[0].full_name + ' ' +results[0].seat_code +'号), 让我们把这个位子留给其他小伙伴好不好');
                            }else{
                                var insertQuery = "insert into user_seat_order (user_id, classroom_id, seat_code, start_time, end_time, schedule_recover_time, status) values "+
                                        "((select user_id from user where openid = ?), ?, ?, ?, ?, ?, 1)",
                                    insertParams = [openid, classroomID, row, column, seatCode, startTime, endTime, scheduleRecoverTime];
                                db.insertQuery(insertQuery, insertParams, function(err, id){
                                    if(err){
                                        callback(err);
                                    }
                                    else{
                                        callback(null, id);
                                    }
                                });
                            }
                        });
                    }else{
                        selectQuery = "select * from user_seat_order_view where openid = ? "+
                            "and classroom_type_name <> ? and start_time = ? and status > 0";
                        selectParams = [openid, '图书馆', startTime];

                        db.executeQuery(selectQuery, selectParams, function (err, results) {
                            if(err){
                                callback(err);
                            }else if(results.length > 5){
                                callback('不能太贪心哦，你已经有'+results.length+'个位子了, 让我们把这个位子留给其他小伙伴好不好');
                            }else{
                                var insertQuery = "insert into user_seat_order (user_id, classroom_id, seat_code, start_time, end_time, status) values "+
                                        "((select user_id from user where openid = ?), ?, ?, ?, ?, 1)",
                                    insertParams = [openid, classroomID, row, column, seatCode, startTime, endTime];
                                db.insertQuery(insertQuery, insertParams, function(err, id){
                                    if(err){
                                        callback('该座位已被其他小伙伴预约，请选择其它座位');
                                    }
                                    else{
                                        callback(null, id);
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }
    });
};*/

/**
 * 根据日期类型（今天/明天）获取新增预约的开始时间、结束时间、座位系统预计回收时间
 * 2016-04-28： CHEN Pu 从newOrder方法中抽取出来
 * */
seat.getOrderRelatedDateByDayType = function(dayType, callback){
    var startTime;
    var today = new Date();
    var scheduleRecoverTime =  new Date(today.getTime() + 30*60*1000);// 当天预约，需在半小时内到现场签到
    if (dayType == 'tomorrow') {
        var nextDay = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        startTime = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate());
        scheduleRecoverTime = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 8, 30);
    } else {
        startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // 八点前预约的 系统回收时间统一定为8:30
        if(today.getHours() < 8){
            scheduleRecoverTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 30);
        }
    }
    var endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
    callback(startTime, endTime, scheduleRecoverTime);
};

/**
* 是否合法的图书馆座位预约申请，在图书馆各楼层间只能预约一个座位
* 2016-04-28：CHEN PU 从newOrder中拆分出来
* */
seat.isValidLibraryOrderRequest = function(openid, classroomID, seatCode, startTime, endTime, callback){

    var selectQuery = "select * from user_seat_order_view where openid = ? "+
        "and classroom_type_name = ? and start_time = ? and status > 0",
        selectParams = [openid, '图书馆', startTime];

    db.executeQuery(selectQuery, selectParams, function (err, results) {
        if(err){
            err.type = 'exception';
            callback(err);
        }else if(results.length > 0){
            err = new Error('不能太贪心哦，你在图书馆已经有一个位子了('+results[0].full_name + ' ' +results[0].seat_code +'号), 让我们把这个位子留给其他小伙伴好不好');
            err.type = 'prompt';
            callback(err);
        }else{
            callback(null);
        }
    });
};

/**
 * 创建预约单
 * 2016-04-28: CHEN PU 从原newOrder中抽取出来
 * **/
seat.createOrder = function(openid, classroomID, seatCode, row, column, startTime, endTime, scheduleRecoverTime, callback){
    var insertQuery = "insert into user_seat_order (openid, classroom_id, seat_code, row_no, column_no, start_time, end_time, schedule_recover_time, status) values "+
            "(?, ?, ?, ?, ?, ?, ?, ?, 1)",
        insertParams = [openid, classroomID, seatCode, row, column, startTime, endTime, scheduleRecoverTime];
    db.insertQuery(insertQuery, insertParams, function(err, id){
        if(err){
            callback(err);
        }
        else{
            seat.log(id, 1, '预约', function(err){
                if(err){
                    callback(err);
                }else{
                    seat.getOrder(id, function(err, order){
                        if(err){
                            callback(err);
                        }else{
                            weixinMessage.orderSeatNotice(openid, order[0].school_id, order[0].full_name,
                                order[0].seat_code, startTime, scheduleRecoverTime);
                        }
                    });

                    callback(null, id);
                }
            });
        }
    });
};

/**
 * 获取座位预约信息
 * 2016-05-08 CHEN PU 创建
 * */
seat.getOrder = function(orderID, callback){
    var selectQuery = "select * from user_seat_order_view where order_id = ?",
        params = [orderID];
    db.executeQuery(selectQuery, params, callback);
};

/**
 * 尝试创建订单
 * 2016-04-29: CHEN　PU 从原seat.js抽取至此
 *
 * */
seat.tryCreateLibraryOrder = function(dayType, openid, classroomID, seatCode, row, column, callback){
    seat.getOrderRelatedDateByDayType('today', function(startTime, endTime, scheduleRecoverTime){
        seat.isValidLibraryOrderRequest(openid, classroomID, seatCode, startTime, endTime, function(err){
            if(err){
                callback(err);
            }else{
                seat.createOrder(openid, classroomID, seatCode, row, column, startTime, endTime, scheduleRecoverTime,
                    function(err, newOrderId){
                        if(err){
                            err.type = 'exception';
                            callback(err);
                        } else{
                            callback(null, newOrderId);
                        }
                    });
            }
        });
    });
};

/*
 * 获取用户当天在某教室的座位预约单
 * 2016-04-19 CHEN PU 新建
 * 2016-04-26 CHEN PU 结果集由只返回预定、暂离状态改为返回预定、签到、暂离三种状态
 * 
 * */
seat.getMyTodayOrderWithinClassroom = function (classroomID, openid, callback){
    var selectQuery = "select * from user_seat_order_view where openid = ? and classroom_id = ? "+
            "and start_time < ? and end_time > ? and status > 0",
        params = [openid, classroomID, new Date(), new Date()];
    db.executeQuery(selectQuery, params, function(err, result){
        if(err){
            callback(err);
        }else{
            callback(null, result);
        }
    });
};

/*
 * 检索当天该座位处于活动状态的预定信息
 * 2016-04-25 CHEN PU 新建
 **/
seat.checkOrderBySeatCode = function(classroomID, seatCode, callback){
    var selectQuery = "select * from user_seat_order_view where seat_code = ? and classroom_id = ? "+
            "and start_time < ? and end_time > ? and status > 0",
        params = [seatCode, classroomID, new Date(), new Date()];
    db.executeQuery(selectQuery, params, callback);
};

seat.getActiveLibrary = function(openid, callback){
    var selectQuery = "select * from user_seat_order_view where openid = ? and end_time > ? and status > 0 and classroom_type_name = ? order by start_time asc, order_time desc",
        params = [openid, new Date(), '图书馆'];
    db.executeQuery(selectQuery, params, callback);
};

seat.getOrderNeedToRecycle = function(callback){
    var selectQuery = "select * from user_seat_order_view where schedule_recover_time < ? and end_time > ? and (status = 1 or status = 3)",
        params = [new Date(), new Date()];
    db.executeQuery(selectQuery, params, callback);
};

/**
 * 排队等待某座位的订单
 * 2016-05-15 CHEN PU 新建
 *
 * */
seat.getQueue = function(classroomID, seatCode, callback){
    var selectQuery = "select * from user_seat_order_view where start_time < ? and end_time > ? and classroom_id = ? and status = 0 and seat_code = ? order by order_time asc",
        params = [new Date(), new Date(), classroomID, seatCode];
    db.executeQuery(selectQuery, params, callback);
};

/**
 * 历史座位
 * **/
seat.getOld = function(openid, callback){
    var selectQuery = "select * from user_seat_order_view where openid = ? and (end_time < ? or status < 0) order by start_time desc, order_time desc",
        params = [openid, new Date()];
    db.executeQuery(selectQuery, params, callback);
};

/*
* 座位签到
* 2016-04-19: CHEN PU 新建
* 2014-04-24: CHEN PU 新增逻辑 设置系统计划回收时间
* */
seat.sign = function (orderID, callback) {
    // 签到后 计划回收时间设为到今天最后
    var now = new Date(),
        nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduleRecoverDate = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate());
    var updateQuery = "update user_seat_order set status = 2, sign_time = ?, schedule_recover_time = ? where order_id = ?",
        params = [new Date(), scheduleRecoverDate, orderID];
    db.executeQuery(updateQuery, params, function(err, result){
        if(err){
            callback(err);
        }else{
            seat.log(orderID, 2, '签到', function(err){
                if(err){
                    callback(err);
                }else{
                    callback(null, scheduleRecoverDate);
                }
            });
        }
    });
};

/*
* 暂离座位
* 2016-04-08 CHEN PU 新建
* 2016-04-19 CHEN PU 修改status值从2变成3,2作为签到的状态
* */
seat.leave = function (orderID, openid, self, callback) {
    var updateQuery = "update user_seat_order set status = 3, leave_time = ?, schedule_recover_time = ? where order_id = ?",
        now = new Date(),
        scheduleRecoverDate = new Date(now.getTime() + 0.5*60*60*1000), // 一般时段半小时后回收座位
        lunchTimeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0),
        lunchTimeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 30, 0),
        supperTimeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0),
        supperTimeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 30, 0);

    if(now >= lunchTimeStart && now <= lunchTimeEnd){
        scheduleRecoverDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0);
    }
    else if(now >= supperTimeStart && now <= supperTimeEnd){
        scheduleRecoverDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
    }

    var params = [new Date(), scheduleRecoverDate, orderID, openid];

    db.executeQuery(updateQuery, params, function(err, result){
        if(err){
            callback(err);
        }else{
            var logMsg = '暂离';
            if(!self){
                logMsg = '代暂离';
            }
            seat.logBySpecificUser(orderID, openid, 3, logMsg, function(err){
                if(err){
                    callback(err);
                }else{
                    seat.getOrder(orderID, function(err, order){
                        if(err){
                            callback(err);
                        }else{
                            weixinMessage.leaveSeatNotice(order[0].openid, order[0].school_id, order[0].full_name,
                                order[0].seat_code, order[0].schedule_recover_time, self);
                        }
                    });

                    callback(null, scheduleRecoverDate);
                }
            });
        }
    });
};

/**
 * 退回座位
 * */
seat.release = function (orderID, openid, callback) {
    var updateQuery = "update user_seat_order set status = -1, leave_time = ?, lock_code = ? where order_id = ? and openid = ?",
        params = [new Date(), orderID, orderID, openid];
    db.executeQuery(updateQuery, params, function(err, result){
        if(err){
            callback(err);
        }else{
            seat.log(orderID, -1, '退座', function(err){
                if(err){
                    callback(err);
                }else{
                    callback(null, result);
                }
            });
        }
    });
};

/**
 * 排队轮候
 * 2016-05-15 CHEN PU 新建
 *
 * */
seat.queue = function(openid, classroomID, seatCode, row, column, startTime, endTime, scheduleRecoverTime, callback){
    var insertQuery = "insert into user_seat_order (openid, classroom_id, seat_code, row_no, column_no, start_time, end_time, schedule_recover_time, status, lock_code) values "+
            "(?, ?, ?, ?, ?, ?, ?, ?, 0, 0)",
        insertParams = [openid, classroomID, seatCode, row, column, startTime, endTime, scheduleRecoverTime];
    db.insertQuery(insertQuery, insertParams, function(err, id){
        if(err){
            callback(err);
        }
        else{
            seat.log(id, 0, '排队轮候', function(err){
                if(err){
                    callback(err);
                }else{
                    seat.getOrder(id, function(err, order){
                        if(err){
                            callback(err);
                        }else{
                            weixinMessage.orderSeatNotice(openid, order[0].school_id, order[0].full_name,
                                order[0].seat_code, startTime, scheduleRecoverTime);
                        }
                    });

                    callback(null, id);
                }
            });
        }
    });
};

/**
 * 未设暂离离座 他人扫码时 系统释放此座
 * 2016-05-11 CHEN PU 创建
 *
 * */
seat.sysReleaseAsNotSetLeave = function (orderID, callback) {
    var updateQuery = "update user_seat_order set status = -3, leave_time = ?, lock_code = ? where order_id = ?",
        params = [new Date(), orderID, orderID];
    db.executeQuery(updateQuery, params, function(err, result){
        if(err){
            callback(err);
        }else{
            seat.logBySpecificUser(orderID, '0101010101', -3, '未设暂离离座 系统回收', function(err){
                if(err){
                    callback(err);
                }else{
                    seat.getOrder(orderID, function(err, order){
                        if(err){
                            callback(err);
                        }else{
                            weixinMessage.recycleAsNotSetLeaveNotice(order[0].openid, order[0].school_id, order[0].full_name,
                                order[0].seat_code);
                        }
                    });

                    callback(null, result);
                }
            });
        }
    });
};

/**
 * 回收座位（暂离、预约未按时签到的）
 * 2016-05-08 CHEN PU
 * **/
seat.sysReleaseAsNotSign = function(orderID, callback){
    var updateQuery = "update user_seat_order set status = -2, real_recover_time = ?, lock_code = ? where order_id = ?",
        params = [new Date(), orderID, orderID];
    db.executeQuery(updateQuery, params, function(err, result){
        if(err){
            callback(err);
        }else{
            seat.logBySpecificUser(orderID, '0101010101', -2, '超时 系统回收', function(err){
                if(err){
                    callback(err);
                }else{
                    seat.getOrder(orderID, function(err, order){
                        if(err){
                            callback(err);
                        }else{
                            weixinMessage.recycleAsNotSignNotice(order[0].openid, order[0].school_id, order[0].full_name,
                                order[0].seat_code);
                        }
                    });

                    callback(null, result);
                }
            });
        }
    });
};

/**
 * 1 预定 2 签到 3 暂离 -1 退座 -2 系统回收
 * 添加座位相关操作日志
 * 2016-05-03: CHEN　PU 新建
 * */
seat.log = function(orderID, logType, logMsg, callback){
    var insertQuery = 'insert into seat_log (classroom_id, seat_code, openid, log_type, log_msg) values '+
            '((select classroom_id from user_seat_order_view where order_id = ?), '+
            '(select seat_code from user_seat_order_view where order_id = ?), '+
            '(select openid from user_seat_order_view where order_id = ?), '+
            '?, ?)',
        insertParams = [orderID, orderID, orderID, logType, logMsg];
    db.insertQuery(insertQuery, insertParams, function(err, id){
        if(err){
            callback(err);
        }
        else{
            callback(null);
        }
    });
};


/**
 * 1 预定 2 签到 3 暂离 -1 退座 -2 系统回收
 * 添加座位相关操作日志
 * 2016-05-15: CHEN　PU 由指定用户执行操作的日志记录
 *
 * */
seat.logBySpecificUser = function(orderID, openid, logType, logMsg, callback){
    var insertQuery = 'insert into seat_log (classroom_id, seat_code, openid, log_type, log_msg) values '+
            '((select classroom_id from user_seat_order_view where order_id = ?), '+
            '(select seat_code from user_seat_order_view where order_id = ?), '+
            '?, ?, ?)',
        insertParams = [orderID, orderID, openid, logType, logMsg];
    db.insertQuery(insertQuery, insertParams, function(err, id){
        if(err){
            callback(err);
        }
        else{
            callback(null);
        }
    });
};

seat.getLog = function(classroomID, seatCode, callback){
    var selectQuery = "select * from seat_log_view where seat_code = ? and classroom_id = ? ",
        params = [seatCode, classroomID];
    db.executeQuery(selectQuery, params, callback);
};

module.exports = seat;