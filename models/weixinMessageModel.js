/**
 * Created by pchen on 2016/1/9.
 */
var weixinMessage = {},
    db = require('./db'),
    urllib = require('urllib'),
    fs = require('fs'),
    path = require('path'),
    qiniu = require("qiniu"),
    debug = require('debug'),
    log = debug('reading'),
    WeiJSAPI = require('../lib/weixin-jssdk');

var weiJSAPI = new WeiJSAPI('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

weixinMessage.logUserLocation = function (openid, lat, lng, callback) {
    var insertQuery = "insert into user_location_log (openid, latitude, longitude) values (?, ?, ?)",
        params = [openid, lat, lng];
    db.insertQuery(insertQuery, params, function (err, id) {
        if (err) {
            callback(err);
        }
        else {
            callback(null);
        }
    });
};

weixinMessage.addUserInfo = function (schoolID, userInfo, callback) {
    var selectQuery = "select user_id from user where openid = ?",
        selectParams = [userInfo.openid];
    db.getId(selectQuery, selectParams, function (err, userId) {
        if (err) {
            callback(err);
        }
        else if (userId > 0) {
            var updateQuery = "update user set school_id = ?, nickname = ?, sex = ?, city = ?, country = ?, province = ?, headimgurl = ? where openid = ?",
                updateParams = [schoolID, userInfo.nickname, userInfo.sex, userInfo.province,
                    userInfo.city, userInfo.country, userInfo.headimgurl, userInfo.openid];

            db.executeQuery(updateQuery, updateParams, function (err, results) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null);
                }
            });
        } else {
            var insertQuery = "insert into user (school_id, openid, nickname, sex, city, country, province, headimgurl) " +
                    "values (?,?,?,?,?,?,?,?)",
                insertParams = [schoolID, userInfo.openid, userInfo.nickname, userInfo.sex, userInfo.province,
                    userInfo.city, userInfo.country, userInfo.headimgurl];
            db.insertQuery(insertQuery, insertParams, function (err, id) {
                if (err) {
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
 * 上传微信资源到七牛云存储
 * 2016-04-21 CHEN PU 从verify.js抽取迁移至此
 * */
weixinMessage.downloadFromWeiXin = function (openid, resourceID, fileName_prefix, callback) {
    weiJSAPI.getAccessToken(function (err, token) {
        if (err) {
            callback(err);
        } else {
            var url = "http://file.api.weixin.qq.com/cgi-bin/media/get";
            var options = {
                method: "GET",
                data: {
                    'access_token': token.data.access_token,
                    'media_id': resourceID,
                    'timeout': 3600000
                }
            };
            // 下载至本地之后再上传至七牛
            urllib.request(url, options, function (err, data, res) {
                if (err) {
                    log("download error %j",res);
                    callback(err);
                } else {
                    // Content-disposition: attachment; filename="MEDIA_ID.jpg"
                    var temarr = res.headers["content-disposition"].split('"');
                    var fileName = fileName_prefix + openid + '_' + temarr[1];
                    var filePath = path.join(__dirname.replace('models', 'public'), 'tempimages', fileName);
                    fs.writeFile(filePath, data, function (err) {
                        if (err) {
                            log("download error %j",err);
                            callback(err);
                        } else {
                            callback(null, fileName, filePath);
                        }
                    });
                }
            });
        }
    });
};

weixinMessage.uploadToQiniu = function (fileName, filePath, callback) {
    qiniu.conf.ACCESS_KEY = 'QvKQ0T5WODacE9YMZZK8q_tVdLX_WpMk_ry5DtQp';
    qiniu.conf.SECRET_KEY = 'altfZLdFEVd6-DS4nOs4ImrfAoIQa_JXAud7zL7s';

    qiniu.conf.UP_HOST = 'http://upload-z1.qiniu.com';
    var putPolicy = new qiniu.rs.PutPolicy('julyangel' + ":" + fileName);
    var token = putPolicy.token();
    var extra = new qiniu.io.PutExtra();
    qiniu.io.putFile(token, fileName, filePath, extra, function (err, ret) {
        if (!err) {
            callback(null, fileName, filePath);
        }
        else {
            log("upload error uploadToQiniu %s",JSON.stringify(err));
            callback(err);
        }
    });
};

module.exports = weixinMessage;