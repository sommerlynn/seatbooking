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
row_count, column_count, seat_count, classroom_type_name, available_rate,
open_time, close_time
FROM classroom LEFT JOIN building_area ON classroom.area_id = building_area.area_id
LEFT JOIN classroom_type ON classroom.classroom_type_id = classroom_type.classroom_type_id
ORDER BY order_no, area_name, classroom_name

ALTER VIEW area_classroom_view AS
SELECT classroom_id, classroom.area_id, area_name, classroom_name,
CONCAT(area_name,' ',classroom_name) AS full_name,
classroom.status AS classroom_status, building_area.status AS area_status,
row_count, column_count, seat_count, seat_map, classroom_type_name, available_rate,
open_time, close_time, latitude, longitude, classroom.direction, school_id
FROM classroom LEFT JOIN building_area ON classroom.area_id = building_area.area_id
LEFT JOIN classroom_type ON classroom.classroom_type_id = classroom_type.classroom_type_id
ORDER BY order_no, area_name, classroom_name


ALTER VIEW user_seat_order_view AS
SELECT order_id, row_no, column_no, user.school_id, user.openid, area_classroom_view.classroom_id, seat_code,
start_time, end_time, order_time, leave_time, sign_time, schedule_recover_time, real_recover_time, user_seat_order.status, nickname, sex, headimgurl,
full_name, area_classroom_view.classroom_type_name
FROM user_seat_order LEFT JOIN user on user_seat_order.openid = user.openid
LEFT JOIN area_classroom_view on user_seat_order.classroom_id = area_classroom_view.classroom_id
ORDER BY  start_time DESC

ALTER VIEW classroom_today_order_view AS
       SELECT classroom_id, start_time,
       COUNT(1) AS order_count
       FROM `user_seat_order_view`
       WHERE end_time > NOW() AND start_time < NOW() AND status > 0
       GROUP BY classroom_id, start_time

ALTER VIEW classroom_nextday_order_view AS
          SELECT classroom_id, start_time,
          COUNT(1) AS order_count
          FROM `user_seat_order_view`
          WHERE start_time > NOW() AND status > 0
          GROUP BY classroom_id, start_time

ALTER VIEW classroom_today_boy_order_view AS
       SELECT classroom_id, start_time,
       COUNT(1) AS boy_order_count
       FROM `user_seat_order_view`
       WHERE end_time > NOW() AND start_time < NOW() AND sex = 1 AND status > 0
       GROUP BY classroom_id, start_time


ALTER VIEW classroom_nextday_boy_order_view AS
       SELECT classroom_id, start_time,
       COUNT(1) AS boy_order_count
       FROM `user_seat_order_view`
       WHERE start_time > NOW() AND sex = 1 AND status > 0
       GROUP BY classroom_id, start_time

ALTER VIEW classroom_today_girl_order_view AS
       SELECT classroom_id, start_time,
       COUNT(1) AS girl_order_count
       FROM `user_seat_order_view`
       WHERE end_time > NOW() AND start_time < NOW() AND sex <> 1 AND status > 0
       GROUP BY classroom_id, start_time

ALTER VIEW classroom_nextday_girl_order_view AS
       SELECT classroom_id, start_time,
       COUNT(1) AS girl_order_count
       FROM `user_seat_order_view`
       WHERE start_time > NOW() AND sex <> 1 AND status > 0
       GROUP BY classroom_id, start_time

ALTER VIEW classroom_today_order_detail_view AS
       SELECT area_classroom_view.*,
       IFNULL(order_count, 0) AS order_count,
       IFNULL(boy_order_count, 0) AS boy_order_count,
       IFNULL(girl_order_count,0) AS girl_order_count,
       (seat_count - IFNULL(order_count, 0)) AS empty_seat_count
       FROM area_classroom_view
       LEFT JOIN classroom_today_order_view ON
       area_classroom_view.classroom_id = classroom_today_order_view.classroom_id
       LEFT JOIN classroom_today_boy_order_view ON
       area_classroom_view.classroom_id = classroom_today_boy_order_view.classroom_id
       LEFT JOIN classroom_today_girl_order_view ON
       area_classroom_view.classroom_id = classroom_today_girl_order_view.classroom_id

ALTER VIEW classroom_nextday_order_detail_view AS
       SELECT area_classroom_view.*,
       IFNULL(order_count, 0) AS order_count,
       IFNULL(boy_order_count, 0) AS boy_order_count,
       IFNULL(girl_order_count,0) AS girl_order_count,
       (seat_count - IFNULL(order_count, 0)) AS empty_seat_count
       FROM area_classroom_view
       LEFT JOIN classroom_nextday_order_view ON
       area_classroom_view.classroom_id = classroom_nextday_order_view.classroom_id
       LEFT JOIN classroom_nextday_boy_order_view ON
       area_classroom_view.classroom_id = classroom_nextday_boy_order_view.classroom_id
       LEFT JOIN classroom_nextday_girl_order_view ON
       area_classroom_view.classroom_id = classroom_nextday_girl_order_view.classroom_id

ALTER VIEW active_leave_application_view AS
        SELECT
            leave_application.*,
            user1.openid applier_openid,
            user1.real_name applier_real_name,
            user1.class_id applier_class_id,
            user2.openid approv_by_openid,
            user2.real_name approve_by_name
        FROM leave_application LEFT JOIN user user1
        ON (leave_application.applier_id = user1.user_id)
        LEFT JOIN user user2
        ON (leave_application.approve_by = user2.user_id)
        WHERE end_time > NOW()

ALTER VIEW inactive_leave_application_view AS
                SELECT
                    leave_application.*,
                    user1.openid applier_openid,
                    user1.real_name applier_real_name,
                    user1.class_id applier_class_id,
                    user2.openid approv_by_openid,
                    user2.real_name approve_by_name
                FROM leave_application LEFT JOIN user user1
                ON (leave_application.applier_id = user1.user_id)
                LEFT JOIN user user2
                ON (leave_application.approve_by = user2.user_id)
                WHERE end_time < NOW()

ALTER VIEW all_leave_application_view AS
                SELECT
                    leave_application.*,
                    user1.openid applier_openid,
                    user1.real_name applier_real_name,
                    user1.class_id applier_class_id,
                    user2.openid approv_by_openid,
                    user2.real_name approve_by_name
                FROM leave_application LEFT JOIN user user1
                ON (leave_application.applier_id = user1.user_id)
                LEFT JOIN user user2
                ON (leave_application.approve_by = user2.user_id)


ALTER VIEW class_manager_user_view AS
        SELECT class_manager.class_id AS manager_class_id, user.*
        FROM class_manager LEFT JOIN user
        ON class_manager.user_id = user.user_id

ALTER VIEW class_manager_user_count_view AS
        SELECT user_id, IFNULL(COUNT(1),0) AS count
        FROM class_manager GROUP BY user_id


ALTER VIEW user_info_view AS
        SELECT user.*,
        IFNULL(class_manager_user_count_view.count,0) AS manage_class_count,
        department.department_name,
        class.class_name
        FROM user LEFT JOIN class_manager_user_count_view
        ON user.user_id = class_manager_user_count_view.user_id
        LEFT JOIN department ON user.department_id = department.department_id
        LEFT JOIN class ON user.class_id = class.class_id

ALTER VIEW reading_digest_view AS
        SELECT reading_digest.digest_id, reading_digest.image_name, reading_digest.create_date,
        reading_digest.image_width, reading_digest.image_height,user.*

        FROM reading_digest LEFT JOIN user
        ON reading_digest.openid = user.openid
        ORDER BY reading_digest.create_date desc

ALTER VIEW seat_log_view AS
        SELECT user.*, seat_log.classroom_id, seat_log.seat_code, seat_log.log_type, seat_log.log_time, seat_log.log_msg, seat_log.order_date, area_classroom_view.full_name
        FROM seat_log LEFT JOIN user
        ON seat_log.openid = user.openid
        LEFT JOIN area_classroom_view
        ON seat_log.classroom_id = area_classroom_view.classroom_id
        WHERE TO_DAYS(NOW()) - TO_DAYS(log_time) <= 1
        ORDER BY log_time DESC, log_id DESC

ALTER VIEW classroom_time_view AS
        SELECT classroom_time.*, building_area.area_name, classroom.classroom_name
        FROM classroom_time LEFT JOIN building_area ON
        classroom_time.area_id = building_area.area_id
        LEFT JOIN classroom ON classroom_time.classroom_id = classroom.classroom_id

ALTER VIEW arbitration_view AS
        SELECT arbitration.*, appiler.real_name as applier_name, area_classroom_view.full_name as classroom_full_name
        FROM arbitration LEFT JOIN user appiler ON
        arbitration.applier_openid = appiler.openid
        LEFT JOIN area_classroom_view ON
        arbitration.classroom_id = area_classroom_view.classroom_id


// 获取各教室今天的订座状态
SELECT area_classroom.*,
row_count*column_count AS seat_count,
IFNULL(order_count, 0) AS order_count,
IFNULL(boy_order_count, 0) AS boy_order_count,
IFNULL(girl_order_count,0) AS girl_order_count
FROM area_classroom
LEFT JOIN
(SELECT A.classroom_id, A.start_time, order_count,
IFNULL(boy_order_count, 0) AS boy_order_count,
IFNULL(girl_order_count,0) AS girl_order_count
FROM
(SELECT classroom_id, start_time,
COUNT(1) AS order_count
FROM `user_seat_order_view`
WHERE end_time > NOW() AND start_time < NOW()
GROUP BY classroom_id, start_time) A
LEFT JOIN
(SELECT classroom_id, start_time,
COUNT(1) AS boy_order_count
FROM `user_seat_order_view`
WHERE sex =1 AND end_time > NOW() AND start_time < NOW() GROUP BY classroom_id, start_time ) B
ON A.classroom_id = B.classroom_id and A.start_time = B.start_time
LEFT JOIN
(SELECT classroom_id, start_time,
COUNT(1) AS girl_order_count
FROM `user_seat_order_view`
WHERE sex <>1 AND end_time > NOW() AND start_time < NOW() GROUP BY classroom_id, start_time ) C
ON A.classroom_id = C.classroom_id and A.start_time = C.start_time) AS D
ON area_classroom.classroom_id = D.classroom_id
