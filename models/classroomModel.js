/**
 * Created by pchen on 2015/12/1.
 */

var classroom = {},
    db = require('./db'),
    schoolModel = require('./schoolModel');

classroom.getAll = function (schoolID, callback) {
    var selectQuery = "select * from area_classroom_view where area_status = 1 and school_id = ?",
        params = [schoolID];
    db.executeQuery(selectQuery, params, callback);
};

classroom.getByType = function (schoolID, type, callback) {
    var selectQuery = "select * from area_classroom_view where area_status = 1 and school_id = ? and classroom_type_name = ?",
        params = [schoolID, type];
    db.executeQuery(selectQuery, params, callback);
};

classroom.getByID = function (classroomID, callback) {
    var selectQuery = "select * from area_classroom_view where classroom_id = ?",
        params = [classroomID];
    db.executeQuery(selectQuery, params, callback);
};

/**
 * 获取教室的开放时间
 * 2016-06-09 CHEN PU 创建
 *
 * */
classroom.getOpenTime = function(classroomID, date, callback){
    var selectQuery = 'select * from classroom_holiday_time where classroom_id = ? and holiday_date = ?',
        selectParams = [classroomID, date];
    db.executeQuery(selectQuery, selectParams, function(err, classroomHoliday){
       if(classroomHoliday.length > 0)
       {
           callback(classroomHoliday[0].open_type, classroomHoliday[0].open_time, classroomHoliday[0].close_time, classroomHoliday[0].holiday_comment);
       }
       else
       {
           selectQuery = 'select * from classroom where classroom_id = ?';
           selectParams = [classroomID];
           db.executeQuery(selectQuery, selectParams, function(err, classroom){
                // 周末
                if(date.getDay() == 0 || date.getDay() == 6)
                {
                    callback(1, classroom[0].weekend_open_time, classroom[0].weekend_close_time);
                }
                else
                {
                    callback(1, classroom[0].open_time, classroom[0].close_time);
                }
           });
       }
    });
};

classroom.getByAreaID = function (areaID, callback) {
    var selectQuery = "select * from classroom_today_order_detail_view where area_id = ? and classroom_status = 1 order by classroom_name",
        params = [areaID];
    db.executeQuery(selectQuery, params, callback);
};

classroom.getOrder = function (classroomID, dayType, callback) {
    var orderDate = new Date();
    if (dayType == 'tomorrow') {
        orderDate = new Date(orderDate.getTime() + 24 * 60 * 60 * 1000);
    }

    var selectQuery = "select * from user_seat_order_view where start_time < ? and end_time > ? and classroom_id = ? and status > 0",
        params = [orderDate, orderDate, classroomID];
    db.executeQuery(selectQuery, params, callback);
};

classroom.getActiveOrder = function (classroomID, dayType, callback) {
    var orderDate = new Date();
    if (dayType == 'tomorrow') {
        orderDate = new Date(orderDate.getTime() + 24 * 60 * 60 * 1000);
    }

    var selectQuery = "select * from user_seat_order_view where start_time < ? and end_time > ? and classroom_id = ? and status > 0",
        params = [orderDate, orderDate, classroomID];
    db.executeQuery(selectQuery, params, callback);
};

classroom.getToday = function (classroomID, callback) {
    var selectQuery = "select * from classroom_today_order_detail_view where classroom_id = ?",
        params = [classroomID];
    db.getObject(selectQuery, params, callback);
};

classroom.getNextday = function (classroomID, callback) {
    var selectQuery = "select * from classroom_nextday_order_detail_view where classroom_id = ?",
        params = [classroomID];
    db.getObject(selectQuery, params, callback);
};

classroom.getOrderByDayType = function (classroomID, dayType, callback) {
    if (dayType == 'tomorrow') {
        classroom.getNextday(classroomID, callback);
    } else {
        classroom.getToday(classroomID, callback);
    }
};

classroom.buildSeatMap = function (classroom, callback) {
    var row_count = classroom.row_count;
    var column_count = classroom.column_count;
    var seatmap = '';
    for (var rindex = 0; rindex < row_count; rindex++) {
        for (var cindex = 0; cindex < column_count; cindex++) {
            seatmap = seatmap + 'a';
        }
        seatmap = seatmap + ';';
    }

    var updateQuery = 'update classroom set seat_map = ? where classroom_id = ?',
        params = [seatmap, classroom.classroom_id];
    db.executeQuery(updateQuery, params, function (err, results) {
        if (err) {
            callback(err);
        }
        else {
            callback(null);
        }
    });
};

classroom.setPosition = function (classroomID, latitude, longitude, callback) {
    var updateQuery = 'update classroom set latitude = ?, longitude = ? where classroom_id = ?',
        params = [latitude, longitude, classroomID];
    db.executeQuery(updateQuery, params, function (err, results) {
        if (err) {
            callback(err);
        }
        else {
            callback(null);
        }
    });
};

/*
 * 计算课程时间，填充classroom_time表单
 * 2016-06-05 CHEN PU 创建
 * */
classroom.insertClassTimeItem = function (schoolID, classroomID, date, callback) {
    var insertQuery = 'insert into classroom_time (classroom_id, area_id, date, section_arr) values ' +
            '(?, (select area_id from classroom where classroom_id = ?) ,?, (select setting_value from school_setting where school_id = ? and setting_name = "Class_Time_Default"))',
        insertParams = [classroomID, classroomID, date, schoolID];
    db.insertQuery(insertQuery, insertParams, function (err, insertedID) {
        if (err) {
            callback(err);
        }
        else {
            schoolModel.getSettingValue(schoolID, 'Term_Start', function (termStart) {
                var termStartDate = new Date(termStart);
                var weekNO = ((date.getTime() - termStartDate.getTime()) / (1000 * 24 * 60 * 60) + termStartDate.getDay() - 1) / 7 + 1;
                var weekProperty = weekNO % 2 == 0 ? '2' : '1';
                var weekDay = date.getDay() == 0 ? 7 : date.getDay();

                var selectQuery = 'select * from classroom_course where classroom_id = ? and ' +
                        '((? >= start_week and ? <= end_week and week_property = 0 and weekday = ?) or ' +
                        '(? >= start_week and ? <= end_week and week_property = ? and weekday = ?))',
                    selectParams = [classroomID, weekNO, weekNO, weekDay, weekNO, weekNO, weekProperty, weekDay];

                db.executeQuery(selectQuery, selectParams,
                    function (err, classroomCourses) {
                        if (classroomCourses.length > 0) {
                            async.forEachSeries(classroomCourses,
                                function (classroomCourse, callback1) {
                                    selectQuery = 'select * from classroom_time where classroom_time_id = ?',
                                    selectParams = [insertedID];
                                    db.executeQuery(selectQuery, selectParams, function (err, classroomTime) {
                                        var sectionArr = '' + classroomTime[0].section_arr;
                                            sectionArr = sectionArr.substring(0, classroomCourse.section - 1) + '1' + sectionArr.substring(classroomCourse.section, sectionArr.length);

                                        var updateQuery = 'update classroom_time set section_arr = ? where classroom_time_id = ?',
                                            updateParams = [sectionArr, insertedID];
                                        db.executeQuery(updateQuery, updateParams, function (err, results) {
                                            callback1(null);
                                        });
                                    });
                                },
                                function(){
                                    callback(null);
                                }
                            );
                        }
                        else {
                            callback(null);
                        }
                    });
            });
        }
    });
};

/*
* 获取普通教学楼列表（图书馆之外的）
* 2016-06-06 CHEN PU 创建
*
* */
classroom.getNormalBuilding = function (schoolID, callback) {
    var selectQuery = 'select * from building_area where school_id = ? and status = 1 and area_name not like \'图书馆%\'order by order_no',
        selectParams = [schoolID];

    db.executeQuery(selectQuery, selectParams, function(err, zones){
        if(err){
            callback(err);
        }
        else{
            callback(null, zones);
        }
    });
};

classroom.getEmptyClassroom = function (areaName, sectionStr, date, callback) {
    var selectQuery = 'select * from classroom_time_view where area_name = ? and date = ? and section_arr regexp ? order by classroom_name',
        selectParams = [areaName, date, sectionStr];
    db.executeQuery(selectQuery, selectParams, function (err, classrooms) {
       if(err){
           callback(err);
       } else{
           callback(null, classrooms);
       }
    });
};

module.exports = classroom;