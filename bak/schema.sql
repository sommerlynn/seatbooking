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