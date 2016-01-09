# seatbooking
A seat booking system for campus


#菜单
 1、获取access_token
 https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxeec4313f49704ee2&secret=36012f4bbf7488518922ca5ae73aef8e

 2、创建菜单
 https://api.weixin.qq.com/cgi-bin/menu/create?access_token=b3E2ZyGxhSpCCxr_TUa9yiT_RlsHM99kJwx9977nes0XbXzXQPnf0O6HtY6TOLStJ53x5orQA8S2vFgNZqCL9aeeSifeuhNCv7ewUaLAzu8JUWbAFAYJL
 {
     "button":[
     {
          "type":"view",
          "name":"预约座位",
          "url":"http://www.julyangel.cn/"
     },
     {
          "type":"view",
          "name":"七玥星空",
          "url":"http://www.julyangel.cn/"
     },
     {
          "type":"view",
          "name":"我的",
          "url":"http://www.julyangel.cn/"
     }
     ]
 }
