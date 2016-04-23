/**
 * Created by Administrator on 2016/4/21.
 */

var reading = {},
    db = require('./db');

reading.listDigestPaged = function(page, pageCount, callback){
    var selectQuery = "select * from reading_digest order by digest_id desc limit ?, ?",
        params = [(page-1)*pageCount, page*pageCount];
    db.executeQuery(selectQuery, params, callback)
};

reading.newDigest = function(openid, imageName, imageWidth, imageHeight, callback){
    var insertQuery = "insert into reading_digest (openid, image_name, image_width, image_height) values (?, ?, ?, ?)",
        params = [openid, imageName, imageWidth, imageHeight];
    db.executeQuery(insertQuery, params, callback)
};

module.exports = reading;