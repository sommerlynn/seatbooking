var lodash_tmpl = require('lodash-template')
var xmllite = require('node-xml-lite')
var debug = require('debug')
var log = debug("wechat-mp::xml::log")
var error = debug("wechat-mp::xml:error")

var propMap = {
    FromUserName: 'uid'
  , ToUserName: 'sp' // as 'service provider'
  , CreateTime: 'createTime'
  , MsgId: 'id'
  , MsgType: 'type'
  , Content: 'text'
}

var paramMap = {
    Location_X: 'lat'
  , Location_Y: 'lng'
  // 上报地理位置事件 Event == LOCATION
  , Latitude: 'lat'
  , Longitude: 'lng'
}

/**
 * convert weixin props into more human readable names
 */
function readable(original, pmap, mmap) {
  var param = {}
  var data = {
    raw: original,
    param: param
  }
  var key, val
  for (key in original) {
    val = original[key]
    if (key in pmap) {
      data[pmap[key]] = val
    } else if (key in mmap) {
      // 名字特殊处理的参数
      param[mmap[key]] = val
    } else {
      // 其他参数都是将首字母转为小写
      key = key[0].toLowerCase() + key.slice(1)
      if (key === 'recognition') {
        data.text = val
      }
      param[key] = val
    }
  }
  data.createTime = new Date(parseInt(data.createTime, 10) * 1000)
  // for compatibility
  data.created = data.createTime
  return data
}

function flattern(tree) {
  var ret = {}
  log("flattern::flattern(item)::printtree")
  log(tree)
  if (tree.childs) {
    tree.childs.forEach(function(item) {
      if (!item.name) {
        ret = item
        return false
      }
      log("flattern::flattern(item)::before::"+item.name)
      var value = flattern(item)
      log("flattern::flattern(item)::after::"+item.name)

      if (item.name in ret) {
        log("flattern::if (item.name in ret)::if" + item.name)
        ret[item.name] = [ret[item.name], value]
      }
      else{
        log("flattern::if (item.name in ret)::else" + item.name)
      }
      ret[item.name] = value
    })
  }
  return ret
}

function parseXml(b, options) {
  options = options || {}

  var pmap = options.propMap|| propMap
  var mmap = options.paramMap || paramMap

  log("parseXml::xmllite.parseString(b)::before")
  var tree = xmllite.parseString(b)
  log("parseXml::flattern(tree)::before")
  var xml = flattern(tree)
  log("parseXml::readable(xml, pmap, mmap)::before")
  return readable(xml, pmap, mmap)
}

var renderXml = lodash_tmpl([
  '<xml>',
    '<ToUserName><![CDATA[<%- uid %>]]></ToUserName>',
    '<FromUserName><![CDATA[<%- sp %>]]></FromUserName>',
    '<CreateTime><%= Math.floor(createTime.valueOf() / 1000) %></CreateTime>',
    '<MsgType><![CDATA[<%= msgType %>]]></MsgType>',
    '<% if (msgType === "transfer_customer_service" && kfAccount) { %>',
      '<TransInfo>',
        '<KfAccount><%- kfAccount %></KfAccount>',
      '</TransInfo>',
    '<% } %>',
    '<% if (msgType === "news") { %>',
      '<ArticleCount><%=content.length%></ArticleCount>',
      '<Articles>',
      '<% content.forEach(function(item){ %>',
        '<item>',
          '<Title><![CDATA[<%=item.title%>]]></Title>',
          '<Description><![CDATA[<%=item.description%>]]></Description>',
          '<PicUrl><![CDATA[<%=item.picUrl || item.picurl || item.pic %>]]></PicUrl>',
          '<Url><![CDATA[<%=item.url%>]]></Url>',
        '</item>',
      '<% }) %>',
      '</Articles>',
    '<% } else if (msgType === "music") { %>',
      '<Music>',
        '<Title><![CDATA[<%=content.title%>]]></Title>',
        '<Description><![CDATA[<%=content.description%>]]></Description>',
        '<MusicUrl><![CDATA[<%=content.musicUrl || content.url %>]]></MusicUrl>',
        '<HQMusicUrl><![CDATA[<%=content.hqMusicUrl || content.hqUrl %>]]></HQMusicUrl>',
      '</Music>',
    '<% } else if (msgType === "voice") { %>',
      '<Voice>',
        '<MediaId><![CDATA[<%=content.mediaId%>]]></MediaId>',
      '</Voice>',
    '<% } else if (msgType === "image") { %>',
      '<Image>',
        '<MediaId><![CDATA[<%-content.mediaId%>]]></MediaId>',
      '</Image>',
    '<% } else if (msgType === "video") { %>',
      '<Video>',
        '<Title><![CDATA[<%=content.title%>]]></Title>',
        '<Description><![CDATA[<%=content.description%>]]></Description>',
        '<MediaId><![CDATA[<%=content.mediaId%>]]></MediaId>',
        '<ThumbMediaId><![CDATA[<%=content.thumbMediaId%>]]></ThumbMediaId>',
      '</Video>',
    '<% } else { %>',
      '<Content><![CDATA[<%=content%>]]></Content>',
    '<% } %>',
  '</xml>'
].join(''))


module.exports = {
  parse: parseXml,
  build: renderXml
}
