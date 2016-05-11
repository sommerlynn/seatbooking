/**
 * Created by pchen on 2015/12/19.
 */

var parse = {},
    db = require('./db'),
    async = require('async');

parse.addCourse = function(courseInfo, callback){
    var selectQuery = "INSERT INTO course (course_name, course_xkkh, teacher_name, teacher_code) VALUES (?, ?, ?, ?)",
        params = [courseInfo['course_name'],courseInfo['course_xkkh'],courseInfo['teacher_name'],courseInfo['teacher_code']];
    db.executeQuery(selectQuery, params, callback);
};

// 例如:
// 主楼B 321;主楼B 321;主楼B 321;主楼B 321;主楼B 321;主楼B 321;主楼B 321;主楼B 321;主楼B 321
// 解析加载教学楼信息
parse.parseBuildingArea = function(courseInfo, callback){
    if((courseInfo[4] == '多媒体' ||
        courseInfo[4] == '普通教室') &&
        courseInfo[6]){
        var classroomarr = courseInfo[6].split(';');

        async.forEachSeries(classroomarr, function(item, callback){
            var areaName = item.split(' ')[0];
            parse.parseOneBuildingArea(areaName, callback);
        },
        function(err){
            callback(err);
        });
    }
    else{
        callback(null);
    }
};

parse.parseOneBuildingArea = function(areaName, callback){
    var searchQuery = "SELECT area_id FROM building_area WHERE area_name LIKE ?",
        params = [areaName.trim().toUpperCase()+'%'];
    db.getId(searchQuery, params, function(err, id){
        if(err){
            callback(err);
        }
        else if(id > 0){
            callback(null);
        }else{
            var insertQuery = "INSERT INTO building_area (area_name) VALUES (?)",
                insertParams = [areaName.trim().toUpperCase()];
            db.insertQuery(insertQuery, insertParams, function(err, id){
                if(err){
                    callback(err);
                }
                else{
                    callback(null);
                }
            });
        }
    });
};

// 解析一组教室信息
// 例如:
// 主楼B 321;主楼B 321;主楼B 321;主楼B 321;主楼B 321;主楼B 321;主楼B 321;主楼B 321;主楼B 321
// 解析加载教室信息
parse.parseClassRoom = function(courseInfo, callback){
    if((courseInfo[4] == '多媒体' ||
        courseInfo[4] == '普通教室') &&
        courseInfo[6]){
        var classroomarr = courseInfo[6].split(';');

        async.forEachSeries(classroomarr, function(item, callback){
                var areaName = item.split(' ')[0];
                var classroom = item.split(' ')[1];
                parse.parseOneClassRoom(areaName, classroom, callback);
            },
            function(err){
                callback(err);
            });
    }
    else{
        callback(null);
    }
};

// 解析一条教室信息 主楼B 321
parse.parseOneClassRoom = function(areaName, classroom, callback){
    var searchQuery = "SELECT area_id FROM building_area WHERE area_name LIKE ?",
        params = [areaName.trim().toUpperCase()+'%'];
    db.getId(searchQuery, params, function(err, areaID){
        if(err){
            callback(err);
        }
        else if(areaID > 0){
            var searchClassroomQuery = "SELECT classroom_id FROM classroom WHERE classroom_name = ? AND area_id = ?",
                searchParams = [classroom.trim(), areaID];
            db.getId(searchClassroomQuery, searchParams, function(err, classroomID){
                if(err){
                    callback(err);
                }
                else if(classroomID > 0){
                    callback(null);
                }
                else{
                    var insertQuery = "INSERT INTO classroom (classroom_name, area_id) VALUES (?, ?)",
                        insertParams = [classroom.trim(), areaID];
                    db.insertQuery(insertQuery, insertParams, function(err, classroomID){
                        if(err){
                            callback(err);
                        }
                        else{
                            callback(null);
                        }
                    });
                }
            });
        }else{
            callback(null);
        }
    });
};


parse.parseClassTime = function(courseInfo, callback){
    if((courseInfo[4] == '多媒体' ||
        courseInfo[4] == '普通教室') &&
        courseInfo[5] &&
        courseInfo[6]){
        var classroomarr = courseInfo[6].split(';');
        var classtimearr = courseInfo[5].split(';');

        var classroomtimearr = [];
        for(var index =0; index < classroomarr.length; index++){
            classroomtimearr[index] = courseInfo[3]+'#'+classroomarr[index]+'#'+classtimearr[index];
        }

        async.forEachSeries(classroomtimearr, function(item, callback){
            parse.parseOneClassTime(item, callback);
        },
        function (err) {
           callback(err);
        })
    }
    else{
       callback(null);
    }
};


// 周三第1,2节{第1-12周|单周}#主楼B 511
parse.parseOneClassTime = function(classroomtime, callback){
    console.log(classroomtime);
    var classroomtimeArr = classroomtime.split('#');
    var coursecode = classroomtimeArr[0];// 课程编号 如(2015-2016-1)-003-51002155-5
    var classroom = classroomtimeArr[1]; // 主楼B 511
    var classtime = classroomtimeArr[2]; // 周三第1,2节{第1-12周|单周}
    var classroomData = classroom.split(' ');
    // 因为数据里存在教1和教1楼两种 统一为教1楼
    if(classroomData[0] == '教1'){
        classroom = '教1楼'+' '+classroomData[1];
    }

    var searchClassroomQuery = "SELECT classroom_id FROM area_classroom_view WHERE full_name = ?",
        searchClassroomParams = [classroom];

    db.getId(searchClassroomQuery, searchClassroomParams, function(err, classroomId){
        if(err){
            callback(err);
        }
        else if (classroomId > 0){


            var searchCourseQuery = 'SELECT course_id FROM course WHERE course_xkkh = ?',
                searchCourseParams = [coursecode];

            db.getId(searchCourseQuery, searchCourseParams, function(err, courseID){
                if(err){
                    callback(err);
                }else if(courseID > 0){
                    var weekdayReg = /周[一二三四五六日]/i;  // 匹配周一、二、三、四、五、六
                    var weekdayArr = classtime.match(weekdayReg);

                    var timeReg = /\d+,\d+/i; // 匹配 1,2 3,4 5,6 7,8 9,10 等上课节次
                    var timeArr = classtime.match(timeReg);

                    var weekReg = /\d+-\d+/i; // 匹配 1-12 等上课周次
                    var weekArr = classtime.match(weekReg);

                    var weekPropertyReg = /[单双]周/i; //匹配单双周
                    var weekPropertyArr = classtime.match(weekPropertyReg);

                    var weekday = weekdayArr[0];// 匹配周一、二、三、四、五、六
                    var weekdayNo = 0;
                    switch (weekday){
                        case "周一":
                            weekdayNo = 1;
                            break;
                        case "周二":
                            weekdayNo = 2;
                            break;
                        case "周三":
                            weekdayNo = 3;
                            break;
                        case "周四":
                            weekdayNo = 4;
                            break;
                        case "周五":
                            weekdayNo = 5;
                            break;
                        case "周六":
                            weekdayNo = 6;
                            break;
                        case "周日":
                            weekdayNo = 7;
                            break;
                    }

                    var time = timeArr[0]; // 匹配 1,2 3,4 5,6 7,8 9,10 等上课节次
                    var start_time = 0, end_time = 0;
                    switch (time){
                        case "1,2":
                            start_time = 8;
                            end_time = 10;
                            break;
                        case "3,4":
                            start_time = 10;
                            end_time = 12;
                            break;
                        case "5,6":
                            start_time = 14;
                            end_time = 16;
                            break;
                        case "7,8":
                            start_time = 16;
                            end_time = 18;
                            break;
                        case "9,10":
                            start_time = 19;
                            end_time = 21;
                            break;
                    }

                    var week = weekArr[0]; // 匹配 1-12 等上课周次
                    var weekData = week.split('-');
                    var start_week = weekData[0];
                    var end_week = weekData[1];

                    var weekProperty = 0;
                    if(weekPropertyArr){
                        switch (weekPropertyArr[0]){
                            case "单周":
                                weekProperty = 1;
                                break;
                            case "双周":
                                weekProperty = 2;
                                break;
                        }
                    }

                    var insertClassroomCourseQuery = "INSERT INTO classroom_course "+
                        "(course_id, classroom_id, start_week, end_week, week_property, weekday, start_time, end_time) "+
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        insertClassroomCourseParams =
                        [courseID, classroomId, start_week, end_week, weekProperty, weekdayNo, start_time, end_time];

                    db.insertQuery(insertClassroomCourseQuery, insertClassroomCourseParams, function(err, id){
                        if(err){
                            callback(err);
                        }else{
                            callback(null);
                        }
                    });
                }
                else{
                    callback(null);
                }
            });

        }else{
            callback(null);
        }
    });


};


module.exports = parse;