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
    weixinAPIClient = require('./weixinTicketModel').getInstance('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

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
    weixinAPIClient.jsAPIClient.getAccessToken(function (err, token) {
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
                    //log("download error %j",res);
                    callback(err);
                } else {
                    // Content-disposition: attachment; filename="MEDIA_ID.jpg"
                    var temarr = res.headers["content-disposition"].split('"');
                    var fileName = fileName_prefix + openid + '_' + temarr[1];
                    var filePath = path.join(__dirname.replace('models', 'public'), 'tempimages', fileName);
                    fs.writeFile(filePath, data, function (err) {
                        if (err) {
                            //log("download error %j",err);
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

    qiniu.conf.UP_HOST = 'http://up-z0.qiniu.com';
    var putPolicy = new qiniu.rs.PutPolicy('julyangel' + ":" + fileName);
    var token = putPolicy.token();
    var extra = new qiniu.io.PutExtra();
    qiniu.io.putFile(token, fileName, filePath, extra, function (err, ret) {
        if (!err) {
            callback(null, fileName, filePath);
        }
        else {
            log("%s",JSON.stringify(err));
            callback(err);
        }
    });
};

/**
 * 座位预约成功时发送的微信模板消息
 * https://mp.weixin.qq.com/advanced/tmplmsg?action=edit&t=tmplmsg/detail&id=uXnnlW_zxLI2g35-SoDl6MtB5vkuZP4QKpCLETuC0JI&token=223773654&lang=zh_CN
 * 2016-05-08 CHEN PU 创建
 *
 * */
weixinMessage.orderSeatNotice = function(openid, schoolID, classroom, seatCode, orderDate, scheduleRecoverTime){
    weixinAPIClient.jsAPIClient.getAccessToken(function(err, token){
        var sendData = {
            "touser":openid,
            "template_id":"uXnnlW_zxLI2g35-SoDl6MtB5vkuZP4QKpCLETuC0JI",
            "url":"http://campus.julyangel.cn/oAuth/"+schoolID+'/me',
            "data":{
                "first":{
                    "value":''
                },
                "keyword1":{
                    "value":classroom
                },
                "keyword2":{
                    "value":seatCode
                },
                "keyword3":{
                    "value":orderDate.toLocaleDateString()
                },
                "remark":{
                    "value":"请在"+scheduleRecoverTime.toLocaleString('en-US', {hour12:false})+'之前扫码签到入座, 过时未签到, 系统收回座位。七玥天使提醒大家, 珍惜同窗情谊, 文明用座, 快乐学习。',
                    "color":"#A00000"
                }
            }
        };
        var url = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token="+token.data.access_token;
        var options = {
            method:"POST",
            headers: {
                'Content-Type': 'application/json'
            },
            content: JSON.stringify(sendData)
        };
        urllib.request(url, options);
    });
};

/**
 * 暂离座位时发送的微信模板消息
 * https://mp.weixin.qq.com/advanced/tmplmsg?action=edit&id=sQoCHWBhCDTyO2eR0fgbghVWkSuPy1oBtwnxdNESNLY&token=223773654&lang=zh_CN
 * 2016-05-08 CHEN PU 创建
 * */
weixinMessage.leaveSeatNotice = function(openid, schoolID, classroom, seatCode, scheduleRecoverTime, self){
    var remark = '';
    if(!self){
        remark = '由于你离开时未设置暂离, 现已由其他小伙伴代你设置暂离。';
    }
    remark += "请在"+scheduleRecoverTime.toLocaleString('en-US', {hour12:false})+'之前回座签到, 过时未返回, 系统收回座位。七玥天使提醒大家, 珍惜同窗情谊, 文明用座, 快乐学习。';

    weixinAPIClient.jsAPIClient.getAccessToken(function(err, token){
        var sendData = {
            "touser":openid,
            "template_id":"sQoCHWBhCDTyO2eR0fgbghVWkSuPy1oBtwnxdNESNLY",
            "url":"http://campus.julyangel.cn/oAuth/"+schoolID+'/me',
            "data":{
                "first":{
                    "value":''
                },
                "keyword1":{
                    "value":classroom +' ' +seatCode
                },
                "keyword2":{
                    "value":scheduleRecoverTime.toLocaleString('en-US', {hour12:false})
                },
                "remark":{
                    "value":remark,
                    "color":"#A00000"
                }
            }
        };
        var url = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token="+token.data.access_token;
        var options = {
            method:"POST",
            headers: {
                'Content-Type': 'application/json'
            },
            content: JSON.stringify(sendData)
        };
        urllib.request(url, options);
    });
};

/**
* 系统释放座位时发送的微信模板消息 （暂离、预约 未按时签到）
 *https://mp.weixin.qq.com/advanced/tmplmsg?action=edit&id=AcUdNRYIr2g2SKMF5yTcGbdW0Q3x_UE7f7fVyN8NFOU&token=1206403495&lang=zh_CN
 * 2016-05-11 CHEN PU 创建
* */
weixinMessage.recycleAsNotSignNotice = function(openid, schoolID, classroom, seatCode){
    weixinAPIClient.jsAPIClient.getAccessToken(function(err, token){
        var sendData = {
            "touser":openid,
            "template_id":"AcUdNRYIr2g2SKMF5yTcGbdW0Q3x_UE7f7fVyN8NFOU",
            "url":"http://campus.julyangel.cn/oAuth/"+schoolID+'/me',
            "data":{
                "first":{
                    "value":''
                },
                "keyword1":{
                    "value":classroom +' ' +seatCode
                },
                "keyword2":{
                    "value":(new Date()).toLocaleString('en-US', {hour12:false})
                },
                "keyword3":{
                    "value":'由于未按时签到, 你的座位已被七玥回收。七玥提醒你自觉遵守《文明用座规范》, 共同营造快乐学习的氛围。',
                    "color":"#A00000"
                }
            }
        };
        var url = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token="+token.data.access_token;
        var options = {
            method:"POST",
            headers: {
                'Content-Type': 'application/json'
            },
            content: JSON.stringify(sendData)
        };
        urllib.request(url, options);
    });
};

/**
 * 系统释放座位时发送的微信模板消息 （暂离未设离座）
 *https://mp.weixin.qq.com/advanced/tmplmsg?action=edit&id=AcUdNRYIr2g2SKMF5yTcGbdW0Q3x_UE7f7fVyN8NFOU&token=1206403495&lang=zh_CN
 * 2016-05-11 CHEN PU 创建
 * */
weixinMessage.recycleAsNotSetLeaveNotice = function(openid, schoolID, classroom, seatCode){
    weixinAPIClient.jsAPIClient.getAccessToken(function(err, token){
        var sendData = {
            "touser":openid,
            "template_id":"AcUdNRYIr2g2SKMF5yTcGbdW0Q3x_UE7f7fVyN8NFOU",
            "url":"http://campus.julyangel.cn/oAuth/"+schoolID+'/me',
            "data":{
                "first":{
                    "value":''
                },
                "keyword1":{
                    "value":classroom +' ' +seatCode
                },
                "keyword2":{
                    "value":(new Date()).toLocaleString('en-US', {hour12:false})
                },
                "keyword3":{
                    "value":'由于你离开时未设暂离, 该座位已被七玥回收。七玥提醒你自觉遵守《文明用座规范》, 共同营造快乐学习的氛围。',
                    "color":"#A00000"
                }
            }
        };
        var url = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token="+token.data.access_token;
        var options = {
            method:"POST",
            headers: {
                'Content-Type': 'application/json'
            },
            content: JSON.stringify(sendData)
        };
        urllib.request(url, options);
    });
};

/**
 * 通过实名认证时的提醒消息
 * 2016-06-10: CHEN PU 创建
 *
 * */
weixinMessage.passVerification = function(openid){
    weixinAPIClient.jsAPIClient.getAccessToken(function(err, token){
        var sendData = {
            "touser":openid,
            "template_id":"WNlYcFrQx_ilCcgf65fxE4kNGTQH0EOw0N8mawMN4T4",
            "url":"http://campus.julyangel.cn/me/info/"+openid,
            "data":{
                "first":{
                    "value":''
                },
                "keyword1":{
                    "value":实名认证
                },
                "keyword2":{
                    "value":(new Date()).toLocaleString('en-US', {hour12:false})
                },
                "keyword3":{
                    "value":'已通过',
                    "color":"#A00000"
                }
            }
        };
        var url = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token="+token.data.access_token;
        var options = {
            method:"POST",
            headers: {
                'Content-Type': 'application/json'
            },
            content: JSON.stringify(sendData)
        };
        urllib.request(url, options);
    });
};

module.exports = weixinMessage;