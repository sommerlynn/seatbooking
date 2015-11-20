var express = require('express');
var sprintf = reqiure("sprintf");

var router = express.Router();

var reponsePictureTextMessage = "<xml>"+
    "<ToUserName><![CDATA[%s]]></ToUserName>"+
    "<FromUserName><![CDATA[%s]]></FromUserName>"+
    "<CreateTime>%s</CreateTime>"+
    "<MsgType><![CDATA[news]]></MsgType>"+
    "<ArticleCount>1</ArticleCount>"+
    "<Articles>"+
    "<item>"+
    "<Title><![CDATA[%s]]></Title>"+
    "<Description><![CDATA[%s]]></Description>"+
    "<PicUrl><![CDATA[%s]]></PicUrl>"+
    "<Url><![CDATA[%s]]></Url>"+
    "</item>"+
    "</Articles>"+
    "</xml>";

router.get('/', function(req, res, next) {
    res.send(req.query.echostr);
});

module.exports = router;