var express = require('express');
var sprintf = require('sprintf');

var router = express.Router();

// wechat: https://github.com/node-webot/wechat
// ΢�Ź���ƽ̨�Զ��ظ���Ϣ�ӿڷ����м��
var wechat = require("wechat");
var wechatconfig = {
    token: '1qazxsw2',
    appid: 'wxc6e2122add47cc8a',
    encodingAESKey: 'TaqAgOU4OlBEstJKO9oqqf23kanXGnFoh4VNmFzBWWM'
};

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


router.post('/', wechat(wechatconfig, function (req, res, next) {
    var message = req.weixin;
    res.reply([
        {
            title:'С�ѻ�ӭ��',
            description:'�ҿ�����������Ŷ',
            picurl:'http://img5.duitang.com/uploads/item/201503/09/20150309134720_B3zUx.thumb.700_0.jpeg',
            url:'http://m.sohu.com'
        }
    ]);
}));

module.exports = router;

/* �ɴ���
 // ���ͻ��˷�������Ϣ��xml��ʽ��תΪJson��ʽ https://github.com/Leonidas-from-XIV/node-xml2js
 // �ͻ����յ�����Ϣ��ʽ:http://mp.weixin.qq.com/wiki/10/79502792eef98d6e0c6e1739da387346.html
 //<xml>
 //<ToUserName><![CDATA[toUser]]></ToUserName>
 //<FromUserName><![CDATA[fromUser]]></FromUserName>
 //<CreateTime>1348831860</CreateTime>
 //<MsgType><![CDATA[text]]></MsgType>
 //<Content><![CDATA[this is a test]]></Content>
 //<MsgId>1234567890123456</MsgId>
 //</xml>
 console.log("test1");
 console.log(req.originalUrl);
 req.setEncoding('utf8');
 var body = "";
 req.on('data', function (chunk) {
 console.log("read data")
 body += chunk; //��ȡ������ת��Ϊ�ַ���
 });

 req.on('end', function () {
 var parasString = require("xml2js").parseString;
 parasString(body, function(err, result){

 console.dir(result);

 //var msgObjFromClient = JSON.parse(result); �˴���������xml2js �Ѿ���xmlת��Ϊjs���󣬶���Json����

 // ���ͻ����ص���Ϣ��ʽ http://mp.weixin.qq.com/wiki/14/89b871b5466b19b3efa4ada8e577d45e.html
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
 result.fromUserName,
 result.toUserName,
 new Date().getTime(),
 "С�ѻ�ӭ��",
 "�ҿ�����������Ŷ",
 "http://img5.duitang.com/uploads/item/201503/09/20150309134720_B3zUx.thumb.700_0.jpeg",
 "http://m.sohu.com");


 console.log(responseMsg);

 res.send(responseMsg);
 });
 }*/