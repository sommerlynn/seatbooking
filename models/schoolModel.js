/**
 * Created by Administrator on 2016/6/5.
 */
var school = {},
    db = require('./db');

school.getSettingValue = function (schoolID, settingName, callback) {
    var selectQuery = 'select * from school_setting where school_id = ? and setting_name = ?',
        selectParams = [schoolID, settingName];
    
    db.executeQuery(selectQuery, selectParams, function (err, results) {
        callback(results[0].setting_value);
    });    
};

module.exports = school;