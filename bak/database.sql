CREATE VIEW building_area_view AS
SELECT school_id,building.building_id, building_name, area_id, area_name
FROM building_area LEFT JOIN building ON building_area.building_id = building.building_id
ORDER BY building_id ASC, area_id ASC

ALTER VIEW building_area_view AS
SELECT school_id,building.building_id, building_name, classroom.area_id, area_name,
COUNT(building.building_id) AS classroom_count, SUM(row_count*column_count) AS seat_count
FROM classroom LEFT JOIN building_area ON classroom.area_id = building_area.area_id
LEFT JOIN building ON building_area.building_id = building.building_id
GROUP BY building.building_id

SELECT WEEKOFYEAR('2015-09-05'),WEEKOFYEAR('2015-09-07'),WEEKOFYEAR(current_date)


ALTER VIEW classroom_view AS
SELECT classroom_id, classroom.area_id, area_name, classroom_name, CONCAT(area_name,' ',classroom_name) AS full_name
FROM classroom LEFT JOIN building_area ON classroom.area_id = building_area.area_id
ORDER BY area_name ASC, classroom_name ASC



CREATE TABLE area_classroom
SELECT classroom_id, classroom.area_id, area_name, classroom_name,
CONCAT(area_name,' ',classroom_name) AS full_name,
classroom.status AS classroom_status, building_area.status AS area_status,
row_count, column_count, aisle
FROM classroom LEFT JOIN building_area ON classroom.area_id = building_area.area_id
ORDER BY order_no, area_name, classroom_name


CREATE VIEW user_seat_order_view AS
SELECT order_id, user.user_id, area_classroom.classroom_id, row_no, column_no,
start_time, end_time, order_time, status, openid, nickname, sex, headimgurl,
full_name
FROM user_seat_order LEFT JOIN user on user_seat_order.user_id = user.user_id
LEFT JOIN area_classroom on user_seat_order.classroom_id = area_classroom.classroom_id

ALTER VIEW user_seat_order_view AS
SELECT order_id, user.user_id, area_classroom.classroom_id, row_no, column_no,
start_time, end_time, order_time, status, openid, nickname, sex, headimgurl,
full_name
FROM user_seat_order LEFT JOIN user on user_seat_order.user_id = user.user_id
LEFT JOIN area_classroom on user_seat_order.classroom_id = area_classroom.classroom_id
ORDER BY DESC start_time

SELECT area_classroom.classroom_id, row_count*column_count AS seat_count,
IFNULL(order_count, 0) AS order_count,
IFNULL(girl_order_count, 0) AS girl_order_count
FROM area_classroom
LEFT JOIN
(SELECT classroom_id, start_time, COUNT(1) AS order_count FROM `user_seat_order_view` GROUP BY classroom_id, start_time) AS A
ON area_classroom.classroom_id = A.classroom_id
LEFT JOIN
(SELECT classroom_id, start_time, COUNT(1) AS girl_order_count FROM `user_seat_order_view` WHERE sex =1 GROUP BY classroom_id, start_time ) AS B
ON area_classroom.classroom_id = B.classroom_id

SELECT A.classroom_id, A.start_time, order_count,
IFNULL(boy_order_count, 0) AS boy_order_count,
IFNULL(girl_order_count,0) AS girl_order_count
FROM
(SELECT classroom_id, start_time,
COUNT(1) AS order_count
FROM `user_seat_order_view`
GROUP BY classroom_id, start_time) A
LEFT JOIN
(SELECT classroom_id, start_time,
COUNT(1) AS boy_order_count
FROM `user_seat_order_view`
WHERE sex =1 GROUP BY classroom_id, start_time ) B
ON A.classroom_id = B.classroom_id and A.start_time = B.start_time
LEFT JOIN
(SELECT classroom_id, start_time,
COUNT(1) AS girl_order_count
FROM `user_seat_order_view`
WHERE sex =2 GROUP BY classroom_id, start_time ) C
ON A.classroom_id = C.classroom_id and A.start_time = C.start_time
ORDER BY A.classroom_id, start_time