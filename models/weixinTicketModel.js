/**
 * Created by pchen on 2016/5/8.
 *
 * 2016-05-08：CHEN PU 集中控制oAuth 和 weixinJS 的票据信息
 */
var oAuth = require('wechat-oauth'),
    jSAPI = require('../lib/weixin-jssdk');

var weixinAPIClient = function(appid, appsecret){
    if (!(this instanceof weixinAPIClient)) {
        this._oAuthClient = new oAuth(appid, appsecret);
        this._jSAPIClient = new jSAPI(appid, appsecret);
    }
};

weixinAPIClient.prototype.oAuthClient = function(){
    return this._oAuthClient;
};

weixinAPIClient.prototype.jSAPIClient = function(){
    return this._jSAPIClient;
};

module.exports = weixinAPIClient;