/**
 * Created by pchen on 2016/5/8.
 *
 * 单例模式：http://www.cnblogs.com/TomXu/archive/2012/02/20/2352817.html
 *
 * 2016-05-08：CHEN PU 集中控制oAuth 和 weixinJS 的票据信息
 */
var oAuth = require('wechat-oauth'),
    jSAPI = require('../lib/weixin-jssdk'),
    debug = require('debug'),
    log = debug('weixin');

var weixinAPIClient = (function () {

    //参数：传递给单例的一个参数集合
    function weixinAPIClientSingleton(appid, appsecret) {
        this.oAuthClient = new oAuth(appid, appsecret);
        this.jSAPIClient = new jSAPI(appid, appsecret);
    }

    //实例容器
    var instance;

    var _static = {
        name: 'weixinAPIClient',

        //获取实例的方法
        //返回Singleton的实例
        getInstance: function (appid, appsecret) {
            if (instance === undefined) {
                instance = new weixinAPIClientSingleton(appid, appsecret);
            }
            return instance;
        }
    };
    return _static;
})();

module.exports = weixinAPIClient;