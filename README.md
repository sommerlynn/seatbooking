# seatbooking
A seat booking system for campus


#菜单
 0、http://www.coolaf.com/

 1、获取access_token
 https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxeec4313f49704ee2&secret=36012f4bbf7488518922ca5ae73aef8e

 2、创建菜单
 https://api.weixin.qq.com/cgi-bin/menu/create?access_token=5rxnMQDfWgXFCdGatGU1-kspbZHqNjT3a8sgUQgYP6zJ9f4XB4SDnZfMkWHJgC7wSdwgOtuk_je6YZgOoHF0MgkY-GrlPa1IUqCY-RKzkV9ugt-1AvV_vy0TQYbpF-hlGGUjAIAZZN
 {
       "button":[
       {
            "type":"view",
            "name":"预约座位",
            "url":"http://www.julyangel.cn/oAuth/building"
       },
       {
            "type":"view",
            "name":"七玥星空",
            "url":"http://www.julyangel.cn/oAuth/index"
       },
       {
            "type":"view",
            "name":"我的",
            "url":"http://www.julyangel.cn/oAuth/me"
       }
       ]
   }
