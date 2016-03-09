# seatbooking
A seat booking system for campus


#菜单
 0、http://www.coolaf.com/

 1、获取access_token
 https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxeec4313f49704ee2&secret=36012f4bbf7488518922ca5ae73aef8e

 2、创建菜单
 https://api.weixin.qq.com/cgi-bin/menu/create?access_token=wnXUiI9oMAdLrRXYQE7iTDz43eebypoSrSAwKWDf4VqhkHzXR0Wt0H6X6b91W60bgpYOTz3KbM8z6YezB0qQlgZLsGlhs30TFFPlK4r6SMELOAdACAHKW
 {
       "button":[
       {
            "type":"view",
            "name":"预约座位",
            "url":"http://www.julyangel.cn/building"
       },
       {
            "type":"view",
            "name":"七玥星空",
            "url":"http://www.julyangel.cn/"
       },
       {
            "type":"view",
            "name":"我的",
            "url":"http://www.julyangel.cn/me"
       }
       ]
   }
