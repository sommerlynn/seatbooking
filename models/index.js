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
    weixinClient:require('./weixinTicketModel'),
    workerModel:require('./workerModel'),
    arbitrationModel:require('./arbitrationModel'),
    desireModel:require('./desireModel')
};

module.exports = models;