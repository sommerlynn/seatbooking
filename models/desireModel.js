/**
 * Created by Administrator on 2016/6/12.
 */
var desire = {},
    db = require('./db');

desire.listDesirePaged = function(schoolID, page, pageCount, callback){
    var selectQuery = "select * from desire_view where school_id = ? order by digest_id desc limit ?, ?",
        params = [schoolID, (page-1)*pageCount, pageCount];
    db.executeQuery(selectQuery, params, callback);
};

desire.newDesire = function (openid, desireType, desireText, desireImage, callback) {
    var insertQuery = "insert into desire (openid, desire_type, desire_text, desire_image, desire_date) values(?, ?, ?, ?, ?)",
        insertParams = [openid, desireType, desireText, desireImage, new Date()];
    db.executeQuery(insertQuery, insertParams, callback);
};

module.exports = desire;