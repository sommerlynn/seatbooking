var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    xlsx = require('node-xlsx'), // https://github.com/mgcrea/node-xlsx
    models = require('../models'),
    debug = require('debug'),
    log = debug('index'),
    weixinAPIClient = models.weixinClient.getInstance('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

//OAuth = require('wechat-oauth'),
//WeiJSAPI = require('../lib/weixin-jssdk'),
//var weiJSAPI = new WeiJSAPI('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
//var client = new OAuth('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
/************************************************************************用户信息*/

/*
 * 获取用户信息1
 * 2016-04-12 CHEN PU 获取用户信息 第一步
 * */
router.get('/oAuth/:schoolID/:from', function (req, res) {
    var url = weixinAPIClient.oAuthClient.getAuthorizeURL('http://campus.julyangel.cn/oAuthGetInfo?from=' + req.params.from + '&schoolID=' + req.params.schoolID, '123', 'snsapi_userinfo');
    res.redirect(url);
});

/*
 * 获取用户信息 CHEN PU 获取用户信息 第二步
 * 2016-05-10 CHEN PU 获取用户的订阅状态信息 (是否有意义?)
 *
 * */
router.get('/oAuthGetInfo', function (req, res) {
    weixinAPIClient.oAuthClient.getAccessToken(req.query.code, function (err, result) {
        if (err) {
            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
        }
        else {
            //var accessToken = result.data.access_token;
            var openid = result.data.openid;
            log(openid);
            /*weixinAPIClient.oAuthClient.getUser({openid: openid, lang: "zh_CN"}, function (err, result) {
                if (err) {
                    res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
                } else {
                    var userInfo = result;

                    models.weixinMessageModel.addUserInfo(req.query.schoolID, userInfo, function (err) {
                        if (err) {
                            res.render('errorView', {openid: openid, title: '服务器故障', message: '服务器故障', error: err});
                        } else {
                            res.redirect(req.query.from + '/' + openid);
                        }
                    });
                }
            });*/
            weixinAPIClient.jsAPIClient.getUserInfo(openid, function (err, userInfo) {
                if(userInfo.subscribe == 1){
                    models.weixinMessageModel.addUserInfo(req.query.schoolID, userInfo, function (err) {
                        if (err) {
                            res.render('errorView', {openid: openid, title: '服务器故障', message: '服务器故障', error: err});
                        } else {
                            res.redirect(req.query.from + '/' + openid);
                        }
                    });
                }else{
                    res.render('indexView', {openid: openid, title: '七玥校园', message: '请先关注七玥天使微信公众号。'});
                }
            });
        }
    });
});


/* GET home page. */
router.get('/', function (req, res) {
    res.render('indexView', {title: '七玥校园'});
});



/************************************************************************我的*/

/*
 * 我的页面
 * 2016-04-05 CHEN PU 新建
 * 2016-04-12 CHEN PU 调整代码,用querystring传递openid
 * */
router.get('/me/:openid', function (req, res) {
    models.userModel.getUser(req.params.openid, function (err, userInfo) {
        if (err) {
            res.render('errorView', {
                openid: req.params.openid,
                title: '服务器故障',
                message: '服务器故障',
                error: err
            });
        } else {
            models.seatModel.getActive(req.params.openid, function (err, userSeatOrders) {
                if (err) {
                    res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
                } else {
                    models.leaveApplicationModel.getActive(req.params.openid, function (err, leaveApplications) {
                        if (err) {
                            res.render('errorView', {
                                openid: req.params.openid,
                                title: '服务器故障',
                                message: '服务器故障',
                                error: err
                            });
                        } else {
                            models.leaveApplicationModel.getForApproving(req.params.openid, function (err, waitForApprovedLeaveApplications) {
                                if (err) {
                                    res.render('errorView', {
                                        openid: req.params.openid,
                                        title: '服务器故障',
                                        message: '服务器故障',
                                        error: err
                                    });
                                } else {
                                    var url = decodeURIComponent('http://' + req.headers.host + req.originalUrl);
                                    weixinAPIClient.jsAPIClient.getJSConfig(url, function (err, weiJSConfig) {
                                        if (err) {
                                            res.render('errorView', {
                                                openid: 'wxeec4313f49704ee2',
                                                title: '服务器故障',
                                                message: '服务器故障',
                                                error: err
                                            });
                                        }else{
                                            res.render('./meView', {
                                                ip: req.ip,
                                                openid: req.params.openid,
                                                weiJSConfig: weiJSConfig,
                                                title: '我的',
                                                userInfo: userInfo[0],
                                                userSeatOrders: userSeatOrders,
                                                leaveApplications: leaveApplications,
                                                waitForApprovedLeaveApplications: waitForApprovedLeaveApplications
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });

});

router.get('/debug', function (req, res) {
    var url = decodeURIComponent('http://' + req.headers.host + req.originalUrl);
    weixinAPIClient.jsAPIClient.getJSConfig(url, function (err, result) {
        if (err) {
            res.render('errorView', {
                openid: 'wxeec4313f49704ee2',
                title: '服务器故障',
                message: '服务器故障',
                error: err
            });
        } else {
            res.render('testView', {
                title: '服务器故障',
                message: result.ticket,
            });
        }
    });
});


module.exports = router;
