/**
 * Created by pchen on 2016/5/8.
 *
 * 2016-05-08：CHEN PU 集中控制oAuth 和 weixinJS 的票据信息
 */
var oAuth = require('wechat-oauth'),
    jSAPI = require('../lib/weixin-jssdk');

var weixinAPIClient = function(appid, appsecret){
    if (!(this instanceof weixinAPIClient)) {
        this.prototype.oAuthClient = new oAuth(appid, appsecret);
        this.prototype.jSAPIClient = new jSAPI(appid, appsecret);
    }
};

weixinAPIClient.oAuthClient = function(){
    return this.prototype.oAuthClient;
};

weixinAPIClient.jSAPIClient = function(){
    return this.prototype.jSAPIClient;
};

module.exports = weixinAPIClient;