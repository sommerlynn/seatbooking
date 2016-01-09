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

weixinMessage.addUserInfo = function(userInfo, callback){
    var insertQuery = "insert into user (openid, nickname, sex, city, country, province, headimgurl) "+
        "values (?,?,?,?,?,?,?,?)",
        params = [userInfo.openid, userInfo.nickname, userInfo.sex, userInfo.province,
            userInfo.city, userInfo.country, userInfo.headimgurl];
    db.insertQuery(insertQuery, params, function(err, id){
        if(err){
            callback(err);
        }
        else{
            callback(null);
        }
    });
};

module.exports = weixinMessage;