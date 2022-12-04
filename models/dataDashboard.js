const { json } = require("express");
const mongoose = require("mongoose");
const dataDashboardSchema = mongoose.Schema({
    monthYear:String,
    iteration:String,
    fileName:String,
    iterationDetails:JSON
})

module.exports = mongoose.model('datadashboards',dataDashboardSchema);