/**
 * Created by pchen on 2016/4/16.
 * 获取微信JS-SDK签名
 * http://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421141115&token=1251988995&lang=zh_CN
 */
var urllib = require('urllib');
var wrapper = require('./util').wrapper;
var extend = require('util')._extend;
var querystring = require('querystring');
var jsSHA = require('jssha');

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


var Ticket = function(data){
    if (!(this instanceof Ticket)) {
        return new Ticket(data);
    }
    this.data = data;
};

Ticket.prototype.isValid = function(){
    return !!this.data.ticket && (new Date().getTime()) < (this.data.create_at + this.data.expires_in * 1000);

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
var WeiJSAPI = function (appid, appsecret, getToken, saveToken, getTicket, saveTicket) {
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

    // ticket的获取和存储
    this.getTicket = getTicket || function(callback){
            callback(null, this.ticket);
        };
    this.saveTicket = saveTicket || function(ticket, callback){
            this.ticket = ticket;
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
WeiJSAPI.prototype._getAccessToken = function (callback) {
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
        that.saveToken(data, function (err) {
            callback(err, AccessToken(data));
        });
    };
};

WeiJSAPI.prototype.getAccessToken = function(callback){
    var that = this;
    this.getToken(function (err, data) {
        if (err) {
            return callback(err);
        }
        // 没有token数据
        if (!data) {
            that._getAccessToken(function(err, token){
                if(err){
                    return callback(err);
                }else{
                    return callback(null, token);
                }
            });
        }else{
            var token = AccessToken(data);
            if (token.isValid()) {
                return callback(null, token);
            }else{
                that._getAccessToken(function(err, token){
                    if(err){
                        return callback(err);
                    }else{
                        return callback(null, token);
                    }
                });
            }
        }
    });
};

WeiJSAPI.prototype._getTicket = function(callback){
    var that = this;
    this.getAccessToken(function(err, token){
        if(err){
            callback(err);
        }else{
            var url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket';
            var info = {
                access_token: token.data.access_token,
                type: 'jsapi'
            };
            var args = {
                data: info,
                dataType: 'json'
            };
            that.request(url, args, wrapper(processTicket(that, callback)));
        }
    });
};

/*!
 * 处理ticket，更新过期时间
 */
var processTicket = function (that, callback) {
    return function (err, data, res) {
        if (err) {
            return callback(err, data);
        }
        data.create_at = new Date().getTime();
        // 存储token
        that.saveTicket(data, function (err) {
            callback(err, Ticket(data));
        });
    };
};

WeiJSAPI.prototype.getAccessTicket = function(callback){
    var that = this;
    this.getTicket(function(err, data){
        if(err){
            callback(err);
        }else{
            if(!data){
                that._getTicket(function(err, ticket){
                    if(err){
                        callback(err);
                    }else{
                        callback(null, ticket);
                    }
                });
            }else{
                var ticket = Ticket(data);
                if(ticket.isValid()){
                    callback(null, ticket);
                }else{
                    that._getTicket(function(err, ticket){
                        if(err){
                            callback(err);
                        }else{
                            callback(null, ticket);
                        }
                    });
                }
            }
        }
    });
};

WeiJSAPI.prototype._createNonceStr = function(){
    return Math.random().toString(36).substr(2, 15);
};

WeiJSAPI.prototype._createTimestamp = function(){
    return parseInt(new Date().getTime() / 1000) + '';
};

WeiJSAPI.prototype._raw = function(args){
    var keys = Object.keys(args);
    keys = keys.sort()
    var newArgs = {};
    keys.forEach(function (key) {
        newArgs[key.toLowerCase()] = args[key];
    });

    var string = '';
    for (var k in newArgs) {
        string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
};

WeiJSAPI.prototype.getJSConfig = function(url, callback){
    var that = this;
    this.getAccessTicket(function(err, ticket){
        if(err){
            callback(err);
        }else{
            var config = {
                jsapi_ticket: ticket.data.ticket,
                nonceStr: that._createNonceStr(),
                timestamp: that._createTimestamp(),
                url: url
            };
            var string = that._raw(config);
            var shaObj = new jsSHA('SHA-1', 'TEXT');
            shaObj.update(string);
            config.signature = shaObj.getHash('HEX');
            config.appId = that.appid;
            delete config["jsapi_ticket"];
            callback(null,config);
        }
    });
};

var processUserInfo = function (callback) {
    return function (err, data, res) {
        if (err) {
            return callback(err, data);
        }
        callback(null, data);
    };
};

WeiJSAPI.prototype.getUserInfo = function (openid, callback) {
    var that = this;
    this.getAccessToken(function(err, token){
        if(err){
            callback(err);
        }else{
            var url = 'https://api.weixin.qq.com/cgi-bin/user/info';
            var info = {
                access_token: token.data.access_token,
                openid: openid,
                lang:'zh-CN'
            };
            var args = {
                data: info,
                dataType: 'json'
            };
            that.request(url, args, wrapper(processUserInfo(that, function(err, userInfo){
                if(err){
                    callback(err);
                }else{
                    callback(null, userInfo);
                }
            })));
        }
    });
};

module.exports = WeiJSAPI;