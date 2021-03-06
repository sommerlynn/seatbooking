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
    OAuth = require('wechat-oauth'),
    WeiJSAPI = require('../lib/weixin-jssdk'),
    urllib = require('urllib'),
    fs = require('fs'),
    path = require('path'),
    qiniu = require("qiniu"),
    debug = require('debug'),
    log = debug('verify');

var weiJSAPI = new WeiJSAPI('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
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
            weiJSAPI.getJSConfig(url, function (err, weiJSConfig) {
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
    var ress = res;
    weiJSAPI.getAccessToken(function (err, token) {
        if (err) {
            log('err0'+err.message);
        }else{
            var url = "http://file.api.weixin.qq.com/cgi-bin/media/get";
            var options = {
                method:"GET",
                data:{
                    'access_token':token.data.access_token,
                    'media_id':req.body.photoServerID
                }
            };
            urllib.request(url, options, function(err, data, res){
                if(err){
                    log('err1'+err.message);
                }else{
                    log('headers %s', res.headers["content-disposition"]);
                    // Content-disposition: attachment; filename="MEDIA_ID.jpg"
                    var temarr = res.headers["content-disposition"].split('"');
                    var filename = req.body.openid+temarr[1];
                    var filePath = path.join(__dirname.replace('routes','public'),'verifyimages',filename);
                    log('filePath::'+filePath);
                    fs.writeFile(filePath, data, function(err){
                        if(err){
                            log('err2'+err.message);
                        }else{
                            log('file is saved');
                        }
                    });
                    qiniu.conf.ACCESS_KEY = 'QvKQ0T5WODacE9YMZZK8q_tVdLX_WpMk_ry5DtQp';
                    qiniu.conf.SECRET_KEY = 'altfZLdFEVd6-DS4nOs4ImrfAoIQa_JXAud7zL7s';

                    var putPolicy = new qiniu.rs.PutPolicy('julyangel'+":"+filename);
                    var token = putPolicy.token();
                    var extra = new qiniu.io.PutExtra();
                    qiniu.io.putFile(token, filename, filePath, extra, function(err, ret) {
                        if(!err) {
                            // 上传成功， 处理返回值
                            log('成功上传至七牛');

                            var personType = 1;
                            if(req.body.type == 0){
                                personType = 2;
                            }
                            models.userModel.fillRealInfo(
                                req.body.name,
                                req.body.code,
                                req.body.department,
                                req.body.classs,
                                req.body.openid,
                                personType,
                                filename,
                                function (err, result) {
                                    if (err) {
                                        ress.send('亲，出错了额，请重试一下' + err.message);
                                    } else {
                                        ress.send('亲，您的信息已认证');
                                    }
                                });
                        } else {
                            // 上传失败， 处理返回代码
                            ress.send('亲，出错了额，请重试一下' + err.message);
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
            weiJSAPI.getJSConfig(url, function (err, weiJSConfig) {
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

module.exports = router;