/**
 * Created by pchen on 2016/1/9.
 */
var weixinMessage = {},
    db = require('./db');

weixinMessage.logUserLocation = function(openid, lat, lng, callback){
    var insertQuery = "insert into user_location_log (openid, latitude, longitude) values (?, ?, ?)",
        params = [openid, lat, lng];
    db.insertQuery(insertQuery, params, function(err, id){
        if(err){
            callback(err);
        }
        else{
            callback(null);
        }
    });
};

weixinMessage.addUserInfo = function(schoolID, userInfo, callback){
    var selectQuery = "select user_id from user where openid = ?",
        selectParams = [userInfo.openid];
    db.getId(selectQuery, selectParams, function(err, userId){
        if(err){
            callback(err);
        }
        else if(userId > 0){
            var updateQuery = "update user set school_id = ?, nickname = ?, sex = ?, city = ?, country = ?, province = ?, headimgurl = ? where openid = ?",
                updateParams = [schoolID, userInfo.nickname, userInfo.sex, userInfo.province,
                    userInfo.city, userInfo.country, userInfo.headimgurl, userInfo.openid];

            db.executeQuery(updateQuery, updateParams, function(err, results){
                if(err){
                    callback(err);
                }
                else{
                    callback(null);
                }
            });
        }else{
            var insertQuery = "insert into user (school_id, openid, nickname, sex, city, country, province, headimgurl) "+
                    "values (?,?,?,?,?,?,?,?)",
                insertParams = [schoolID, userInfo.openid, userInfo.nickname, userInfo.sex, userInfo.province,
                    userInfo.city, userInfo.country, userInfo.headimgurl];
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

module.exports = weixinMessage;