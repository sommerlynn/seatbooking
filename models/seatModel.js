/**
 * Created by Administrator on 2016/4/15.
 */

var seat = {},
    db = require('./db'),
    weixinMessage = require('./weixinMessageModel'),
    classroom = require('./classroomModel'),
    userModel = require('./userModel');

/**
 * 根据日期类型（今天/明天）获取新增预约的开始时间、结束时间、座位系统预计回收时间
 * TODO: 当天预约 午餐时段、晚餐时段
 * 2016-04-28：CHEN Pu 从newOrder方法中抽取出来
 * 2016-06-09: CHEN PU 计划回收时间根据开馆时间来计算 开馆半小时内 同时考虑假期开馆时间
 *                     预约当日座位只能在开馆时间半小时内
 *
 * */
seat.getOrderRelatedDateByDayType = function (classroomID, dayType, callback) {
    var startTime;
    var now = new Date();
    var scheduleRecoverTime = new Date(now.getTime() + 30 * 60 * 1000);// 当天预约，需在半小时内到现场签到
    if (dayType == 'tomorrow') {
        var nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        startTime = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate());

        var nextDayDate = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate());
        // 能执行到此步 正常情况下 openType 都应该是1 即教室是开放的
        classroom.getOpenTime(classroomID, nextDayDate, function (openType, openTime, closeTime) {
            if (openType == 1) {
                // 开馆半小时内
                var openTimeArr = openTime.split(':');
                scheduleRecoverTime = new Date(nextDayDate.getFullYear(), nextDayDate.getMonth(), nextDayDate.getDate(), openTimeArr[0], openTimeArr[1]);
                scheduleRecoverTime = new Date(scheduleRecoverTime.getTime() + 0.5 * 60 * 60 * 1000);
                var endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
                callback(startTime, endTime, scheduleRecoverTime);
            }
        });
    } else {
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        classroom.getOpenTime(classroomID, nowDate, function (openType, openTime, closeTime, holidayComment) {
            // 开馆半小时内
            if (openType == 1) {
                // 开馆半小时内
                var openTimeArr = openTime.split(':');
                scheduleRecoverTime = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), openTimeArr[0], openTimeArr[1]);
                scheduleRecoverTime = new Date(scheduleRecoverTime.getTime() + 0.5 * 60 * 60 * 1000);
                var endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
                callback(startTime, endTime, scheduleRecoverTime);
            }
        });

        /*var supperTimeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 30, 0);
         lunchTimeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0),
         lunchTimeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 30, 0),
         supperTimeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0),*/

        // 八点前预约的 系统回收时间统一定为8:00
        /*if(now.getHours() < 8){
         scheduleRecoverTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
         }
         else
         if(now >= lunchTimeStart && now <= lunchTimeEnd){
         scheduleRecoverTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0);
         }
         else
         if(now >= supperTimeStart && now <= supperTimeEnd){
         scheduleRecoverTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
         }*/
    }
};

/**
 * 检测是否可以进行预约指定日期的教室的座位
 * 2016-06-09: CHEN PU 创建
 *
 * */
seat.canOrder = function (openid, classroomID, orderDate, callback) {
    classroom.getOpenTime(classroomID, orderDate, function (openType, openTime, closeTime, holidayComment) {
        userModel.getUser(openid, function (err, user) {
            if (user[0].credit_score > 0) {
                if (openType == 1) {
                    var openTimeArr = openTime.split(':'),
                        openTimeDate = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate(),
                            openTimeArr[0], openTimeArr[1]),
                        openTimeMore30Minutes = new Date(openTimeDate.getTime() + 0.5 * 60 * 60 * 1000);
                    var now = new Date();
                    if (now <= openTimeMore30Minutes) {
                        callback(1, '', openType, openTime, closeTime);
                    } else {
                        callback(0, '开馆半小时后需在现场选座, 不能在线预约当日座位。', openType, openTime, closeTime);
                    }
                }
                else{
                    callback(0, holidayComment, openType, openTime, closeTime);
                }
            }
            else{
                callback(0, '你的信用分已被扣完, 不能再继续预约座位, 请到图书馆相关部门办理信用分恢复。', openType, openTime, closeTime);
            }
        });
    });
};


/**
 * 是否合法的图书馆座位预约申请，在图书馆各楼层间只能预约一个座位
 * 2016-04-28：CHEN PU 从newOrder中拆分出来
 * */
seat.isValidLibraryOrderRequest = function (openid, classroomID, seatCode, startTime, endTime, callback) {

    var selectQuery = "select * from user_seat_order_view where openid = ? " +
            "and classroom_type_name = ? and start_time = ? and status > 0",
        selectParams = [openid, '图书馆', startTime];

    db.executeQuery(selectQuery, selectParams, function (err, results) {
        if (err) {
            err.type = 'exception';
            callback(err);
        } else if (results.length > 0) {
            err = new Error('不能太贪心哦，你在图书馆已经有一个位子了(' + results[0].full_name + ' ' + results[0].seat_code + '号), 让我们把这个位子留给其他小伙伴好不好');
            err.type = 'prompt';
            callback(err);
        } else {
            callback(null);
        }
    });
};

/**
 * 检查是否满足座位的临时使用权条件
 * 一个人 只能获得临时座位一个；一个座位只能有一个临时使用人
 *
 *
 * */
seat.isValidEnQueueRequest = function (openid, classroomID, seatCode, callback) {
    var selectQuery = "select * from user_seat_order_view where start_time < ? and end_time > ? and classroom_id = ? and seat_code = ? and status = 0 order by order_time asc",
        params = [new Date(), new Date(), openid, classroomID, seatCode];
    db.executeQuery(selectQuery, params, function (err, results) {
        if (err) {
            err.type = 'exception';
            callback(err);
        }
        else if (results.length > 0) {
            if (results[0].openid == openid) {
                err = new Error('你已获得此座的临时使用权, 如原主人未在' + results[0].schedule_recover_time.toLocaleTimeString('en-US', {hour12: false}) + '之前返回签到, 你将获得该座位的正式使用权。');
                err.type = 'prompt';
                callback(err);
            }
            else {
                err = new Error('该座位已有其他临时使用人, 不能再选了, 我们来重新找一个位子吧。');
                err.type = 'prompt';
                callback(err);
            }
        }
        else {
            // 检查是否有其他临时使用座位
            selectQuery = "select * from user_seat_order_view where start_time < ? and end_time > ? and status = 0 order by order_time asc",
                params = [new Date(), new Date(), openid];

            db.executeQuery(selectQuery, params, function (err, results) {
                if (err) {
                    err.type = 'exception';
                    callback(err);
                }
                else if (results.length > 0) {
                    err = new Error('你已有一个临时座位,' + results[0].full_name + ' ' + results[0].seat_code + '不能再选此座了。');
                    err.type = 'prompt';
                    callback(err);
                }
                else {
                    callback(null);
                }
            });
        }
    });
};

/**
 * 创建预约单
 * 2016-04-28: CHEN PU 从原newOrder中抽取出来
 * **/
seat.createOrder = function (openid, classroomID, seatCode, row, column, startTime, endTime, scheduleRecoverTime, callback) {
    var insertQuery = "insert into user_seat_order (openid, classroom_id, seat_code, row_no, column_no, start_time, end_time, schedule_recover_time, status) values " +
            "(?, ?, ?, ?, ?, ?, ?, ?, 1)",
        insertParams = [openid, classroomID, seatCode, row, column, startTime, endTime, scheduleRecoverTime];
    db.insertQuery(insertQuery, insertParams, function (err, id) {
        if (err) {
            callback(err);
        }
        else {
            seat.log(id, 1, '预约', function (err) {
                if (err) {
                    callback(err);
                } else {
                    seat.getOrder(id, function (err, order) {
                        if (err) {
                            callback(err);
                        } else {
                            weixinMessage.orderSeatNotice(openid, order[0].school_id, order[0].full_name,
                                order[0].seat_code, startTime, scheduleRecoverTime);
                        }
                    });

                    callback(null, scheduleRecoverTime);
                }
            });
        }
    });
};

/**
 * 现场选座
 * 2016-06-03: CHEN PU 现场选座
 * **/
seat.chooseSetAtScene = function (openid, classroomID, seatCode, row, column, startTime, endTime, scheduleRecoverTime, callback) {
    var insertQuery = "insert into user_seat_order (openid, classroom_id, seat_code, row_no, column_no, start_time, end_time, schedule_recover_time, status, sign_time) values " +
            "(?, ?, ?, ?, ?, ?, ?, ?, 2, ?)",
        insertParams = [openid, classroomID, seatCode, row, column, startTime, endTime, scheduleRecoverTime, new Date()];
    db.insertQuery(insertQuery, insertParams, function (err, id) {
        if (err) {
            callback(err);
        }
        else {
            seat.log(id, 1, '现场选座', function (err) {
                if (err) {
                    callback(err);
                } else {
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
seat.getOrder = function (orderID, callback) {
    var selectQuery = "select * from user_seat_order_view where order_id = ?",
        params = [orderID];
    db.executeQuery(selectQuery, params, callback);
};

/**
 * 尝试创建订单
 * 2016-04-29: CHEN　PU 从原seat.js抽取至此
 *
 * */
seat.tryCreateLibraryOrder = function (dayType, openid, classroomID, seatCode, row, column, type, callback) {
    seat.getOrderRelatedDateByDayType(classroomID, dayType, function (startTime, endTime, scheduleRecoverTime) {
        seat.isValidLibraryOrderRequest(openid, classroomID, seatCode, startTime, endTime, function (err) {
            if (err) {
                callback(err);
            }
            else {
                if (type == 'order') {
                    seat.createOrder(openid, classroomID, seatCode, row, column, startTime, endTime, scheduleRecoverTime,
                        function (err, scheduleRecoverTime) {
                            if (err) {
                                err.type = 'exception';
                                callback(err);
                            } else {
                                callback(null, scheduleRecoverTime);
                            }
                        });
                }
                else if (type == 'scene') {
                    // 现场选座
                    seat.chooseSetAtScene(openid, classroomID, seatCode, row, column, startTime, endTime, scheduleRecoverTime,
                        function (err, newOrderId) {
                            if (err) {
                                err.type = 'exception';
                                callback(err);
                            } else {

                                callback(null, newOrderId);
                            }
                        });
                }
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
seat.getMyTodayOrderWithinClassroom = function (classroomID, openid, callback) {
    var selectQuery = "select * from user_seat_order_view where openid = ? and classroom_id = ? " +
            "and start_time < ? and end_time > ? and status > 0",
        params = [openid, classroomID, new Date(), new Date()];
    db.executeQuery(selectQuery, params, function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
};

/**
 * 检索当天该座位处于活动状态的预定信息
 * 2016-04-25 CHEN PU 新建
 **/
seat.checkOrderBySeatCode = function (classroomID, seatCode, dayType, callback) {
    var selectQuery = "select * from user_seat_order_view where seat_code = ? and classroom_id = ? " +
            "and start_time < ? and end_time > ? and status > 0",
        today = new Date(),
        tomorrow = new Date(today.getTime()+24*60*60*1000),
        orderDate = today;
    if(dayType == 'tomorrow'){
        orderDate = tomorrow;
    }
    var params = [seatCode, classroomID, orderDate, orderDate];
    db.executeQuery(selectQuery, params, callback);
};



/**
 * 预约、暂离、已签到 三种状态的座位订单
 *
 *
 * */
seat.getActiveLibrary = function (openid, callback) {
    var selectQuery = "select * from user_seat_order_view where openid = ? and end_time > ? and status > 0 and classroom_type_name = ? order by start_time asc, order_time desc",
        params = [openid, new Date(), '图书馆'];
    db.executeQuery(selectQuery, params, callback);
};

/**
 * 等待、预约、暂离、已签到 四种状态的座位订单
 *
 *
 * **/
seat.getActiveLibraryIncludeWaitQueue = function (openid, callback) {
    var selectQuery = "select * from user_seat_order_view where openid = ? and end_time > ? and status >= 0 and classroom_type_name = ? order by start_time asc, order_time desc",
        params = [openid, new Date(), '图书馆'];
    db.executeQuery(selectQuery, params, callback);
};

/**
 * 需要释放的订单
 *
 * */
seat.getOrderNeedToRecycle = function (callback) {
    var selectQuery = "select * from user_seat_order_view where schedule_recover_time < ? and end_time > ? and (status = 1 or status = 3)",
        params = [new Date(), new Date()];
    db.executeQuery(selectQuery, params, callback);
};

/**
 * 需要通知的订单
 *
 **/
seat.getOrderNeedToNotice = function (callback) {
    var selectQuery = "select * from user_seat_order_view where " +
        "((schedule_recover_time < ? and schedule_recover_time > ?) || (schedule_recover_time < ? and schedule_recover_time > ?)) "+
        "and end_time > ? and (status = 1 or status = 3)",
        now = new Date(),
        tenMinutesLater = new Date(now.getTime()+10*60*1000),
        nineMinutesLater = new Date(now.getTime()+9*60*1000),
        threeMinutesLater = new Date(now.getTime()+3*60*1000),
        twoMinutesLater = new Date(now.getTime()+2*60*1000),
        params = [tenMinutesLater, nineMinutesLater, threeMinutesLater, twoMinutesLater, now];
    db.executeQuery(selectQuery, params, callback);
};

/**
 * 排队等待某座位的订单
 * 2016-05-15 CHEN PU 新建
 *
 * */
seat.getQueue = function (classroomID, seatCode, callback) {
    var selectQuery = "select * from user_seat_order_view where start_time < ? and end_time > ? and classroom_id = ? and status = 0 and seat_code = ? order by order_time asc",
        params = [new Date(), new Date(), classroomID, seatCode];
    db.executeQuery(selectQuery, params, callback);
};

/**
 * 历史座位
 * **/
seat.getOld = function (openid, callback) {
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
    db.executeQuery(updateQuery, params, function (err, result) {
        if (err) {
            callback(err);
        } else {
            seat.log(orderID, 2, '签到', function (err) {
                if (err) {
                    callback(err);
                } else {
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
        scheduleRecoverDate = new Date(now.getTime() + 0.5 * 60 * 60 * 1000), // 一般时段半小时后回收座位
        lunchTimeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0),
        lunchTimeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 30, 0),
        supperTimeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0),
        supperTimeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 30, 0);

    if (now >= lunchTimeStart && now <= lunchTimeEnd) {
        scheduleRecoverDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0);
    }
    else if (now >= supperTimeStart && now <= supperTimeEnd) {
        scheduleRecoverDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
    }

    var params = [new Date(), scheduleRecoverDate, orderID, openid];

    db.executeQuery(updateQuery, params, function (err, result) {
        if (err) {
            callback(err);
        } else {
            var logMsg = '暂离';
            if (!self) {
                logMsg = '暂离[代]';
            }
            seat.logBySpecificUser(orderID, openid, 3, logMsg, function (err) {
                if (err) {
                    callback(err);
                } else {
                    seat.getOrder(orderID, function (err, order) {
                        if (err) {
                            callback(err);
                        } else {
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
    db.executeQuery(updateQuery, params, function (err, result) {
        if (err) {
            callback(err);
        } else {
            seat.log(orderID, -1, '退座', function (err) {
                if (err) {
                    callback(err);
                } else {
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
seat.enQueue = function (openid, classroomID, seatCode, row, column, startTime, endTime, scheduleRecoverTime, callback) {
    var insertQuery = "insert into user_seat_order (openid, classroom_id, seat_code, row_no, column_no, start_time, end_time, schedule_recover_time, status, lock_code) values " +
            "(?, ?, ?, ?, ?, ?, ?, ?, 0, 0)",
        insertParams = [openid, classroomID, seatCode, row, column, startTime, endTime, scheduleRecoverTime];
    db.insertQuery(insertQuery, insertParams, function (err, id) {
        if (err) {
            callback(err);
        }
        else {
            seat.log(id, 0, '排队轮候', function (err) {
                if (err) {
                    callback(err);
                } else {
                    seat.getOrder(id, function (err, order) {
                        if (err) {
                            callback(err);
                        } else {
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
 * 取销座位等待 （本人或他人操作）
 * 2016-05-17 CHEN PU 新建
 *
 * */
seat.dequeue = function (orderID, self) {
    var updatQuery = "update user_seat_order set status = ";
};

/**
 * 未设暂离离座 他人扫码时 系统释放此座
 * 2016-05-11 CHEN PU 创建
 *
 * */
seat.sysReleaseAsNotSetLeave = function (orderID, callback) {
    var updateQuery = "update user_seat_order set status = -3, leave_time = ?, lock_code = ? where order_id = ?",
        params = [new Date(), orderID, orderID];
    db.executeQuery(updateQuery, params, function (err, result) {
        if (err) {
            callback(err);
        } else {
            seat.logBySpecificUser(orderID, '0101010101', -3, '未设暂离离座 系统回收', function (err) {
                if (err) {
                    callback(err);
                } else {
                    seat.getOrder(orderID, function (err, order) {
                        if (err) {
                            callback(err);
                        } else {
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
seat.sysReleaseAsNotSign = function (orderID, callback) {
    var updateQuery = "update user_seat_order set status = -2, real_recover_time = ?, lock_code = ? where order_id = ?",
        params = [new Date(), orderID, orderID];
    db.executeQuery(updateQuery, params, function (err, result) {
        if (err) {
            callback(err);
        } else {
            seat.logBySpecificUser(orderID, '0101010101', -2, '超时回收', function (err) {
                if (err) {
                    callback(err);
                } else {
                    seat.getOrder(orderID, function (err, order) {
                        if (err) {
                            callback(err);
                        } else {
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
seat.log = function (orderID, logType, logMsg, callback) {
    var insertQuery = 'insert into seat_log (classroom_id, seat_code, openid, order_date, log_type, log_msg) values ' +
            '((select classroom_id from user_seat_order_view where order_id = ?), ' +
            '(select seat_code from user_seat_order_view where order_id = ?), ' +
            '(select openid from user_seat_order_view where order_id = ?), ' +
            '(select start_time from user_seat_order_view where order_id = ?), ' +
            '?, ?)',
        insertParams = [orderID, orderID, orderID, orderID, logType, logMsg];
    db.insertQuery(insertQuery, insertParams, function (err, id) {
        if (err) {
            callback(err);
        }
        else {
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
seat.logBySpecificUser = function (orderID, openid, logType, logMsg, callback) {
    var insertQuery = 'insert into seat_log (classroom_id, seat_code, order_date, openid, log_type, log_msg) values ' +
            '((select classroom_id from user_seat_order_view where order_id = ?), ' +
            '(select seat_code from user_seat_order_view where order_id = ?), ' +
            '(select start_time from user_seat_order_view where order_id = ?), ' +
            '?, ?, ?)',
        insertParams = [orderID, orderID, orderID, openid, logType, logMsg];
    db.insertQuery(insertQuery, insertParams, function (err, id) {
        if (err) {
            callback(err);
        }
        else {
            callback(null);
        }
    });
};

seat.getLogByDateType = function (classroomID, seatCode, dateType, callback) {
    var today = new Date(),
        date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (dateType == 'tomorrow') {
        date = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    }
    var //selectQuery = "select * from seat_log_view where seat_code = ? and classroom_id = ? and TO_DAYS(order_date) = TO_DAYS(?) order by log_time asc",
        selectQuery = "select * from seat_log_view where seat_code = ? and classroom_id = ? and order_date = ? order by log_time asc",
        params = [seatCode, classroomID, date];
    db.executeQuery(selectQuery, params, function (err, results) {
        if (err) {
            callback(err);
        } else {
            callback(null, results);
        }
    });
};

seat.getLog = function (classroomID, seatCode, callback) {
    seat.getLogByDateType(classroomID, seatCode, 'today', callback);
};

module.exports = seat;