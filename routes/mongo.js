const mongoose =  require("mongoose");
const mongoConnectionString = "mongodb://localhost:27017/dataDashboard";

module.exports= async()=>{
    await mongoose.connect(mongoConnectionString,{
        useNewUrlParser:true,
        useUnifiedTopology:true
    });
    return mongoose;
}
