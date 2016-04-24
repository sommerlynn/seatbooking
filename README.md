# seatbooking
A seat booking system for campus

- 当天预约的座位在半小时内需到现场扫码签到，未签到系统自动回收
- 第二天预约的座位需在早八点半之前到现场扫码签到，未签到系统自动回收
- 离开时请设置暂离，设置后系统保留座位一小时，一小时后未返座扫码签到，系统自动回收
- 午餐，晚饭时段暂离，系统预留两个小时，过时未返座扫码签到，系统自动回收
- 离开未设置暂离的，其他人可通过扫座位二维码获得该座位使用权


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
