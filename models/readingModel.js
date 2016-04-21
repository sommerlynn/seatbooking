/**
 * Created by Administrator on 2016/4/21.
 */

var reading = {},
    db = require('./db');

reading.newDigest = function(openid, imageName, imageHeight, imageWidth, callback){
    var insertQuery = "insert into reading_digest (openid, image_name, image_width, image_width) values (?, ?, ?, ?)",
        params = [openid, imageName, imageHeight, imageWidth];
    db.executeQuery(insertQuery, params, callback)
};

module.exports = reading;