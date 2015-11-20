var express = require('express');
var sprintf = require('sprintf');

var router = express.Router();

var receivedTextMessageFromClient = {
    toUserName: this.toUserName,
    fromUserName: this.fromUserName,
    createTime: this.createTime,
    msgType: this.msgType,
    content: this.content,
    msgId: this.msgId
};

var reponsePictureTextMessageXML = "<xml>"+
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


router.post('/', function(req, res, next) {
    // 将客户端发来的消息（xml格式）转为Json格式 https://github.com/Leonidas-from-XIV/node-xml2js
    // 客户端收到的消息格式:http://mp.weixin.qq.com/wiki/10/79502792eef98d6e0c6e1739da387346.html
    //<xml>
    //<ToUserName><![CDATA[toUser]]></ToUserName>
    //<FromUserName><![CDATA[fromUser]]></FromUserName>
    //<CreateTime>1348831860</CreateTime>
    //<MsgType><![CDATA[text]]></MsgType>
    //<Content><![CDATA[this is a test]]></Content>
    //<MsgId>1234567890123456</MsgId>
    //</xml>
    console.log("test1");
    console.log(req.baseUrl);
    var body = "";
    req.on('data', function (chunk) {
        body += chunk; //读取参数流转化为字符串
    });
    console.log(body);
    req.on('end', function () {
        var parasString = require("xml2js");
        parasString(body, function(err, result){
            console.log(err.toString());
            var msgObjFromClient = JSON.parse(result);
            console.log(msgObjFromClient.toString());
            // 给客户返回的消息格式 http://mp.weixin.qq.com/wiki/14/89b871b5466b19b3efa4ada8e577d45e.html
            //<xml>
            //<ToUserName><![CDATA[toUser]]></ToUserName>
            //<FromUserName><![CDATA[fromUser]]></FromUserName>
            //<CreateTime>12345678</CreateTime>
            //<MsgType><![CDATA[news]]></MsgType>
            //<ArticleCount>2</ArticleCount>
            //<Articles>
            //<item>
            //<Title><![CDATA[title1]]></Title>
            //<Description><![CDATA[description1]]></Description>
            //<PicUrl><![CDATA[picurl]]></PicUrl>
            //<Url><![CDATA[url]]></Url>
            //</item>
            //<item>
            //<Title><![CDATA[title]]></Title>
            //<Description><![CDATA[description]]></Description>
            //<PicUrl><![CDATA[picurl]]></PicUrl>
            //<Url><![CDATA[url]]></Url>
            //</item>
            //</Articles>
            //</xml>
            var responseMsg = sprintf(reponsePictureTextMessageXML,
                msgObjFromClient.fromUserName,
                msgObjFromClient.toUserName,
                new Date().getTime(),
                "小蜓欢迎你",
                "我可以陪你聊天哦",
                "http://img5.duitang.com/uploads/item/201503/09/20150309134720_B3zUx.thumb.700_0.jpeg",
                "http://m.sohu.com");
            res.send(responseMsg);
        });
    });
});

module.exports = router;