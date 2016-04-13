# seatbooking
A seat booking system for campus


#菜单
 0、http://www.coolaf.com/

 1、获取access_token
 https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxeec4313f49704ee2&secret=36012f4bbf7488518922ca5ae73aef8e

 2、创建菜单
 https://api.weixin.qq.com/cgi-bin/menu/create?access_token=E4uGGL9IBzSDkZdpIs1-v1EprNCTgvFi7c8fAmYOWF2HPoEfAoqo8ARd823DBfGu1y34Ih7g6NF_lEVA_3j4sM819jkSlUfXNOlwdq7J75Gyz8xzrJcLrUzwGnOnYYU2GPQjADAOXY
 {
       "button":[
       {
            "type":"view",
            "name":"预约座位",
            "url":"http://www.julyangel.cn/oAuth/1/building"
       },
       {
            "type":"view",
            "name":"七玥星空",
            "url":"http://www.julyangel.cn/oAuth/1/index"
       },
       {
            "type":"view",
            "name":"我的",
            "url":"http://www.julyangel.cn/oAuth/1/me"
       }
       ]
   }
