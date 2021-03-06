/**
 * Created by pchen on 2016/6/9.
 */
var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    xlsx = require('node-xlsx'), // https://github.com/mgcrea/node-xlsx
    models = require('../models'),
    debug = require('debug'),
    log = debug('index'),
    weixinAPIClient = models.weixinClient.getInstance('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

/**
 * 申请仲裁
 * 2016-05-15 CHEN PU 新建
 *
 *
 * */
router.get('/arbitration/:openid', function(req, res){
    var openid = req.params.openid;
    models.userModel.getUser(openid, function(err, user){
        models.classroomModel.getByType(user[0].school_id, '图书馆', function(err, classrooms){
            var classroomIDArr = [],
                classroomNameArr =[];
            for(var index = 0; index < classrooms.length; index++){
                /*classroomIDArr += ''+classrooms[index].classroom_id+'';
                 classroomNameArr += ''+classrooms[index].full_name+'';
                 if(index < classrooms.length -1){
                 classroomIDArr += ',';
                 classroomNameArr += ',';
                 }*/
                classroomIDArr.push(classrooms[index].classroom_id);
                classroomNameArr.push(classrooms[index].full_name);
            }
            res.render('./arbitration/arbitrationSheetView',
                {
                    title:'仲裁申请',
                    openid:openid,
                    classroomIDArr:classroomIDArr,
                    classroomNameArr:classroomNameArr
                }
            );
        });
    });
});

/**
 * 提交仲裁
 * 2016-05-15 CHEN PU 新建
 * 2016-05-15 CHEN PU
 *
 * */
router.post('/arbitration/submitInfo', function(req, res){
    models.userModel.getUser(req.body.openid, function(err, user){
        if(user[0].status == 2){
            models.arbitrationModel.new(req.body.openid, req.body.classroomName, req.body.seatCode, req.body.description, function(err, result){
                if(err){
                    res.send(err.message);
                }
                else{
                    res.send('你的仲裁申请已成功提交, 管理员会马上前来处理。请珍惜同学情谊, 快乐学习, 给彼此留下美好的回忆。');
                }
            });
        }
        else{
            res.send('你尚未进行实名认证, 请先在【我的】->【实名认证】完成认证再提交申诉。');
        }
    });
});

/**
 * 待处理仲裁申请
 * 2016-06-10 CHEN PU 新建
 *
 *
 * */
router.get('/arbitrationList/:openid', function(req, res){
    models.arbitrationModel.listNew(req.params.openid, function(err, arbitrationList){
        res.render('./arbitration/arbitrationListView',
            {
                openid:req.params.openid,
                title: '仲裁请求',
                arbitrationList:arbitrationList
            });
    });
});

/**
 * 处理仲裁申请
 * 2016-06-10 CHEN PU 新建
 *
 *
 * */
router.get('/arbitrationDealWith/:arbitrationID/:openid', function(req, res){
    models.arbitrationModel.get(req.params.arbitrationID, function(err, arbitration){
        res.render('./arbitration/arbitrationDealWithView',
            {
                openid:req.params.openid,
                title: '仲裁处理',
                arbitration:arbitration[0]
            });
    });
});

/**
 * 提交仲裁申请的处理结果
 * 2016-06-10 CHEN PU 新建
 *
 *
 * */
router.post('/arbitrationDealWith/submitOperateComment', function(req, res){
    models.arbitrationModel.dealWith(req.body.arbitrationID, req.body.operatorOpenid, req.body.operationComment, function(err, result){
        if(err){
            res.send('出错了额，请重试一下' + err.message);
        }else{
            res.send('已成功提交');
        }
    });
});

/**
 * 处理仲裁申请
 * 2016-06-10 CHEN PU 新建
 *
 *
 * */
router.get('/arbitrationDealWith/:arbitrationID/:openid', function(req, res){
    models.arbitrationModel.get(req.params.arbitrationID, function(err, arbitration){
        res.render('./arbitration/arbitrationDealWithView',
            {
                openid:req.params.openid,
                title: '仲裁处理',
                arbitration:arbitration[0]
            });
    });
});

/**
 * 已处理仲裁申请
 * 2016-06-10 CHEN PU 新建
 *
 *
 * */
router.get('/arbitrationOld/:openid', function(req, res){
    models.arbitrationModel.listOld(req.params.openid, function(err, arbitrationList){
        res.render('./arbitration/arbitrationOldView',
            {
                openid:req.params.openid,
                title: '已处理仲裁',
                arbitrationList:arbitrationList
            });
    });
});

/**
 * 所有已处理的仲裁申请
 * 2016-06-23 CHEN PU 新建
 *
 *
 * */
router.get('/arbitrationAllList/:openid', function(req, res){
    models.arbitrationModel.listAllProcessed(function(err, arbitrationList){
        res.render('./arbitration/arbitrationAllView',
            {
                openid:req.params.openid,
                title: '座位仲裁',
                arbitrationList:arbitrationList
            });
    });
});

module.exports = router;