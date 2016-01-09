/**
 * Created by pchen on 2016/1/9.
 */
var weixinMessage = {},
    db = require('./db');

weixinMessage.logUserLocation = function(openid, lat, lng){
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

module.exports = weixinMessage;