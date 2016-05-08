/**
 * Created by pchen on 2015/12/1.
 */
var models;

models = {
    classroomModel : require('./classroomModel'),
    parseModel: require('./parseModel'),
    userModel:require('./userModel'),
    weixinMessageModel:require('./weixinMessageModel'),
    departmentClassModel:require('./departmentClassModel'),
    leaveApplicationModel:require('./leaveApplicationModel'),
    seatModel:require('./seatModel'),
    readingModel:require('./readingModel'),
    weixinAPIClient:require('./weixinTicketModel')
};

module.exports = models;