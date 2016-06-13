/**
 * Created by Administrator on 2016/4/14.
 * 实名认证
 */
var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    xlsx = require('node-xlsx'), // https://github.com/mgcrea/node-xlsx
    models = require('../models'),
    urllib = require('urllib'),
    fs = require('fs'),
    path = require('path'),
    qiniu = require("qiniu"),
    debug = require('debug'),
    log = debug('verify'),
    weixinAPIClient = models.weixinClient.getInstance('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

//OAuth = require('wechat-oauth'),
//WeiJSAPI = require('../lib/weixin-jssdk'),
//var weiJSAPI = new WeiJSAPI('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
/*
 * 实名认证页面
 * 2016-04-11 CHEN PU 新建
 * */
router.get('/me/verifySheet/:openid', function (req, res) {
    /*models.departmentClassModel.getActiveDepartments(function (err, departments) {
        if (err) {
            res.render('errorView', {openid: req.params.openid, title: '服务器故障', message: '服务器故障', error: err});
        } else {*/
            var url = decodeURIComponent('http://' + req.headers.host + req.originalUrl);
            weixinAPIClient.jsAPIClient.getJSConfig(url, function (err, weiJSConfig) {
                if (err) {
                    res.render('errorView', {
                        openid: 'wxeec4313f49704ee2',
                        title: '服务器故障',
                        message: '服务器故障',
                        error: err
                    });
                } else {
                    /*var departmentNameArr = new Array();
                    for (var index = 0; index < departments.length; index++) {
                        departmentNameArr[index] = departments[index].department_name;
                    }*/
                    res.render('./verify/verifySheetView',
                        {
                            ip: req.query.ip,
                            openid: req.params.openid,
                            title: '身份信息',
                            /*departments: departmentNameArr,*/
                            weiJSConfig: weiJSConfig
                        });
                }
            });


        /*}
    });*/
});

/*
 * 提交用户实名信息
 * 2016-04-11 CHEN PU 新建
 * */
router.post('/me/verifySheet/submitInfo', function (req, res) {
    // Content-disposition: attachment; filename="MEDIA_ID.jpg"

    models.weixinMessageModel.downloadFromWeiXin(req.body.openid, req.body.photoServerID, 'verify_', function (err, fileName, filePath) {
        if (err) {
            res.send('哎呀, 出了点小故障, 我们再来一次好不好');
        } else {
            models.weixinMessageModel.uploadToQiniu(fileName, filePath, function (err, fileName, filePath) {
                if (err) {
                    res.send('哎呀, 出了点小故障, 我们再来一次好不好'+err.message);
                } else {
                    var personType = 1;
                    if(req.body.type == '老师'){
                        personType = 2;
                    }
                    models.userModel.fillRealInfo(
                        req.body.name,
                        req.body.code,
                        req.body.department,
                        req.body.classs,
                        req.body.openid,
                        personType,
                        fileName,
                        function (err, result) {
                            if (err) {
                                res.send('出错了额，请重试一下' + err.message);
                            } else {
                                res.send('您的信息已成功提交');
                            }
                        });
                }
            });
        }
    });
});

/*
 * 实名认证页面上根据用户类别获取部门列表
 * 2016-04-11 CHEN PU 新建
 * */
router.post('/me/verifySheet/department', function (req, res) {
    var personType = 1;
    if(req.body.type == '老师'){
        personType = 2;
    }
    models.departmentClassModel.getActiveDepartments(personType, function (err, departments) {
        if (err) {
            res.send('');
        } else {
            var departmentStr = '';
            for (var index = 0; index < departments.length; index++) {
                departmentStr += departments[index].department_name;
                if (index < departments.length - 1) {
                    departmentStr += ',';
                }
            }
            res.send(departmentStr);
        }
    });
});

/*
 * 实名认证页面上获取对应学院的下属班级列表
 * 2016-04-11 CHEN PU 新建
 * */
router.post('/me/verifySheet/class', function (req, res) {
    models.departmentClassModel.getClass(req.body.department, function (err, classs) {
        var classStr = '';
        for (var index = 0; index < classs.length; index++) {
            classStr += classs[index].class_name;
            if (index < classs.length - 1) {
                classStr += ',';
            }
        }
        res.send(classStr);
    });
});

/**
 * 身份信息
 * 2016-04-17 CHEN PU 新建
 */
router.get('/me/info/:openid', function (req, res) {
    models.userModel.getUser(req.params.openid, function (err, userInfo) {
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
                } else {
                    res.render('./verify/infoView', {
                        ip: req.ip,
                        openid: req.params.openid,
                        weiJSConfig: weiJSConfig,
                        title: '身份信息',
                        userInfo: userInfo[0]
                    });
                }
            });
        }
    });
});

/**
 * 待审核的用户列表
 * 2016-06-10 CHEN PU 新建
 */
router.get('/verifyList/:openid', function(req, res){
    models.userModel.getWaitForConfirmList(function(err, users){
        res.render('./verify/verifyListView',
            {
                openid:req.params.openid,
                title: '实名认证',
                users:users
            });
    });
});

/**
 * 审核用户
 * 2016-06-10 CHEN PU 新建
 */
router.get('/verifyDetail/:applierOpenid/:adminOpenid', function(req, res){
    models.userModel.getUser(req.params.applierOpenid, function (err, userInfo) {
        if (err) {
            res.render('errorView', {
                openid: req.params.adminOpenid,
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
                } else {
                    res.render('./verify/verifyDetailView', {
                        openid: req.params.adminOpenid,
                        weiJSConfig: weiJSConfig,
                        title: '认证审核',
                        userInfo: userInfo[0]
                    });
                }
            });
        }
    });
});

/**
 * 通过实名认证
 * 2016-06-13 CHEN PU 创建
 * 
 * */
router.post('/verifyDetail/pass', function(req, res){
    models.userModel.passVerification(req.body.applierOpenid, req.body.adminOpenid, function(err, results){
        if(err){
            res.send('出错了额，请重试一下' + err.message);
        }else{
            res.send('已成功审批');
        }
    });
});

/**
 * 驳回实名认证
 * 2016-06-13 CHEN PU 创建
 *
 * */
router.post('/verifyDetail/reject', function(req, res){
    models.userModel.rejectVerification(req.body.applierOpenid, req.body.rejectMsg, function(err, results){
        if(err){
            res.send('出错了额，请重试一下' + err.message);
        }else{
            res.send('已成功驳回');
        }
    });
});

module.exports = router;