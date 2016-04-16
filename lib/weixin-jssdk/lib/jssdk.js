/**
 * Created by pchen on 2016/4/16.
 * 获取微信JS-SDK签名
 * http://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421141115&token=1251988995&lang=zh_CN
 */
var urllib = require('urllib');
var wrapper = require('./util').wrapper;
var extend = require('util')._extend;
var querystring = require('querystring');

var AccessToken = function (data) {
    if (!(this instanceof AccessToken)) {
        return new AccessToken(data);
    }
    this.data = data;
};
/*!
 * 检查AccessToken是否有效，检查规则为当前时间和过期时间进行对比
 *
 * Examples:
 * ```
 * token.isValid();
 * ```
 */
AccessToken.prototype.isValid = function () {
    return !!this.data.access_token && (new Date().getTime()) < (this.data.create_at + this.data.expires_in * 1000);
};

/*!
 * 处理token，更新过期时间
 */
var processToken = function (that, callback) {
    return function (err, data, res) {
        if (err) {
            return callback(err, data);
        }
        data.create_at = new Date().getTime();
        // 存储token
        that.saveToken(data.openid, data, function (err) {
            callback(err, AccessToken(data));
        });
    };
};

/**
 * 根据appid和appsecret创建OAuth接口的构造函数
 * 如需跨进程跨机器进行操作，access token需要进行全局维护
 * 使用使用token的优先级是：
 *
 * 1. 使用当前缓存的token对象
 * 2. 调用开发传入的获取token的异步方法，获得token之后使用（并缓存它）。

 * Examples:
 * ```
 * var OAuth = require('wechat-oauth');
 * var api = new OAuth('appid', 'secret');
 * ```
 * @param {String} appid 在公众平台上申请得到的appid
 * @param {String} appsecret 在公众平台上申请得到的app secret
 * @param {Function} getToken 用于获取token的方法
 * @param {Function} saveToken 用于保存token的方法
 */
var WeiJSAPI = function (appid, appsecret, getToken, saveToken) {
    this.appid = appid;
    this.appsecret = appsecret;
    // token的获取和存储
    this.getToken = getToken || function (callback) {
            callback(null, this.accessToken);
        };
    if (!saveToken && process.env.NODE_ENV === 'production') {
        console.warn("Please dont save oauth token into memory under production");
    }
    this.saveToken = saveToken || function (token, callback) {
            this.accessToken = token;
            callback(null);
        };
    this.defaults = {};
};


/**
 * 用于设置urllib的默认options
 *
 * Examples:
 * ```
 * oauth.setOpts({timeout: 15000});
 * ```
 * @param {Object} opts 默认选项
 */
WeiJSAPI.prototype.setOpts = function (opts) {
    this.defaults = opts;
};


/**
 * 用于设置urllib的默认options
 *
 * Examples:
 * ```
 * oauth.setOpts({timeout: 15000});
 * ```
 * @param {Object} opts 默认选项
 */
WeiJSAPI.prototype.setOpts = function (opts) {
    this.defaults = opts;
};

/*!
 * urllib的封装
 *
 * @param {String} url 路径
 * @param {Object} opts urllib选项
 * @param {Function} callback 回调函数
 */
WeiJSAPI.prototype.request = function (url, opts, callback) {
    var options = {};
    extend(options, this.defaults);
    if (typeof opts === 'function') {
        callback = opts;
        opts = {};
    }
    for (var key in opts) {
        if (key !== 'headers') {
            options[key] = opts[key];
        } else {
            if (opts.headers) {
                options.headers = options.headers || {};
                extend(options.headers, opts.headers);
            }
        }
    }
    urllib.request(url, options, callback);
};

/**
 * 根据授权获取到的code，换取access token和openid
 * 获取openid之后，可以调用`wechat.API`来获取更多信息
 * Examples:
 * ```
 * api.getAccessToken(code, callback);
 * ```
 * Callback:
 *
 * - `err`, 获取access token出现异常时的异常对象
 * - `result`, 成功时得到的响应结果
 *
 * Result:
 * ```
 * {
 *  data: {
 *    "access_token": "ACCESS_TOKEN",
 *    "expires_in": 7200,
 *    "refresh_token": "REFRESH_TOKEN",
 *    "openid": "OPENID",
 *    "scope": "SCOPE"
 *  }
 * }
 * ```
 * @param {String} code 授权获取到的code
 * @param {Function} callback 回调函数
 */
WeiJSAPI.prototype.getAccessToken = function (callback) {
    var url = 'https://api.weixin.qq.com/cgi-bin/token';
    var info = {
        appid: this.appid,
        secret: this.appsecret,
        grant_type: 'client_credential'
    };
    var args = {
        data: info,
        dataType: 'json'
    };
    this.request(url, args, wrapper(processToken(this, callback)));
};

WeiJSAPI.prototype._getTicket = function(accessToken, callback){
    var url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket';
    var info = {
        access_token: accessToken,
        type: 'jsapi'
    };
    var args = {
        data: info,
        dataType: 'json'
    };
    this.request(url, args, wrapper(callback));
};

WeiJSAPI.prototype.getTicket = function(callback){
    var that = this;
    this.getToken(function (err, data) {
        if (err) {
            return callback(err);
        }
        // 没有token数据
        if (!data) {
            var error = new Error('No token for ' + options.openid + ', please authorize first.');
            error.name = 'NoOAuthTokenError';
            return callback(error);
        }
        var token = AccessToken(data);
        if (token.isValid()) {
            that._getTicket(token.data.access_token, callback);
        }else{
            that.getAccessToken(function(err, token){
                if (err) {
                    return callback(err);
                }
                that._getTicket(token.access_token, callback);
            });
        }
    });
};


module.exports = WeiJSAPI;