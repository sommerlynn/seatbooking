var express = require('express');
var router = express.Router();

var replyPicTextMsg ="<xml>"+
                        "<ToUserName><![CDATA[%s]]></ToUserName>"+
                        "<FromUserName><![CDATA[%s]]></FromUserName>"+
                        "<CreateTime>%s</CreateTime>"+
                        "<MsgType><![CDATA[%s]]></MsgType>"+
                        "<ArticleCount>1</ArticleCount>"+
                        "<Articles>"+
                        "<item>"+
                        "<Title><![CDATA[%s]]></Title>"+
                        "<Description><![CDATA[%s]]></Description>"+
                        "<PicUrl><![CDATA[%s]]></PicUrl>"+
                        "<Url><![CDATA[%s]]></Url>"+
                        "</item>"+
                        "</Articles>"
                        "</xml>";

router.get('/', function(req, res, next) {
    res.send(req.query.echostr);
});

router.post('/', function(req, res, next){

});

function ProcessMsgFromClient(req, res, next){
    req.on('da')
}

module.exports = router;