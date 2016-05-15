/**
 * Created by pchen on 2016/5/15.
 */


var arbitration = {},
    db = require('./db');

arbitration.new = function(applier_openid, classroom_full_name, seat_code, description, callback){
    var insertQuery = "insert into arbitration (applier_openid, classroom_id, seat_code, description) VALUES (?, (select classroom_id from area_classroom_view where full_name = ? ), ?, ?)",
        params = [applier_openid,classroom_full_name,seat_code,description];
    db.executeQuery(insertQuery, params, callback);
};

module.exports = arbitration;
