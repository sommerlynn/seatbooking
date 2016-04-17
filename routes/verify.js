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
    OAuth = require('wechat-oauth');


/*
 * 实名认证页面
 * 2016-04-11 CHEN PU 新建
 * */
router.get('/me/verifySheet/:openid', function (req, res) {
    models.departmentClassModel.getActiveDepartments(function (err, departments) {
        if (err) {
            res.render('errorView', {openid: req.params.openid, title: '服务器故障', message: '服务器故障', error: err});
        } else {
            var departmentNameArr = new Array();
            for (var index = 0; index < departments.length; index++) {
                departmentNameArr[index] = departments[index].department_name;
            }
            res.render('./verify/verifySheetView',
                {
                    ip:req.query.ip,
                    openid: req.params.openid,
                    title: '实名认证',
                    departments: departmentNameArr
                });
        }
    });
});

/*
 * 提交用户实名信息
 * 2016-04-11 CHEN PU 新建
 * */
router.post('/me/verifySheet/submitInfo', function (req, res) {
    models.userModel.fillRealInfo(
        req.body.name,
        req.body.code,
        req.body.department,
        req.body.classs,
        req.body.openid,
        function (err, result) {
            if (err) {
                res.send('亲，出错了额，请重试一下' + err.message);
            } else {
                res.send('亲，您的信息已认证');
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
router.get('/me/info', function(req, res){
    models.userModel.getUser(req.params.openid, function (err, userInfo) {
        if (err) {
            res.render('errorView', {
                openid: req.params.openid,
                title: '服务器故障',
                message: '服务器故障',
                error: err
            });
        } else {
            res.render('./verify/infoView',{
                openid: req.params.openid,
                userInfo:userInfo
            });
        }
    });
});

module.exports = router;