var express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const mongo = require('./mongo');
const mongoUserSchema = require('../models/dataDashboard');
var xlsx = require('xlsx')
const multer  = require('multer');
var path = require('path');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname) //Appending extension
    }
  })
const upload = multer({storage:storage});

router.get('/',function(req,res){
res.render('index');
});

router.get('/iterationData/:yearMonth',async function(req,res){
    var dbResult = await fetchRecordByMonthYear({monthYear:req.params.yearMonth});
    res.json({status:"success",data:dbResult});
});

router.get('/display/:yearMonth',async function(req,res){
    res.render('dashboard');
});

router.post('/uploadIterationDetails', upload.single('iterationDataFile'), async function (req, res, next) {
    console.log(req.file.originalname);
    console.log(req.file.filename);
    console.log(req.file.path);
    console.log('Inside Dashboard=%j',req.body)
    try {
        let path = req.file.path;
        var workbook = xlsx.readFile(path);
        var sheet_name_list = workbook.SheetNames;
        let jsonData = xlsx.utils.sheet_to_json(
          workbook.Sheets[sheet_name_list[0]]
        );
        if (jsonData.length === 0) {
          return res.status(400).json({
            success: false,
            message: "xml sheet has no data",
          });
        }
        let savedData = jsonData;
        await insertToUserDb({monthYear:req.body.monthYear,iteration:req.body.iteration,fileName:req.file.filename,iterationDetails:jsonData})
        return res.status(201).json({
          success: true,
          message: savedData.length + " rows added to the database",
        });
      } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
    //res.json({status:"success",message:"File Uploaded Successfully"})
    // req.file is the `iterationDataFile` file
    // req.body will hold the text fields, if there were any
  });

  router.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
    // req.files is array of `photos` files
    // req.body will contain the text fields, if there were any
  })
  
  const cpUpload = upload.fields([{ name: 'iterationDataFile', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
  router.post('/cool-profile', cpUpload, function (req, res, next) {
    // req.files is an object (String -> Array) where fieldname is the key, and the value is array of files
    //
    // e.g.
    //  req.files['iterationDataFile'][0] -> File
    //  req.files['gallery'] -> Array
    //
    // req.body will contain the text fields, if there were any
  })

// DB CRUD Methods
const insertToUserDb = async (data) =>{
await mongo().then(async (mongoose)=>{
    try{
        console.log("connected to MongoDB");
        console.log("data=%j",data);
        await new mongoUserSchema(data).save();
        console.log("Data inserted to mongo DB Successfully");
    }finally{
        mongoose.connection.close();
    }
})
}

const upsertToUserDb = async (searchQuery,upsertData) =>{
    await mongo().then(async (mongoose)=>{
        try{
            console.log("connected to MongoDB");
            console.log("Search Query=%j",searchQuery);
            await mongoUserSchema.findOneAndUpdate(searchQuery,upsertData,{upsert: true});
            console.log("Data Updated to mongo DB Successfully");
        }catch(e){
            console.log("Exception = "+e.message);
        }finally{
            mongoose.connection.close();
        }
    })
    }

const fetchRecordByMonthYear = async (searchQuery) =>{
    var dbResult="NONE";
    await mongo().then(async (mongoose)=>{
        
        try{
            console.log("connected to MongoDB");
            console.log("Search Query=%j",searchQuery);
            await mongoUserSchema.find(searchQuery).then( (docs)=> {
                //console.log("First function call : ", docs);
                dbResult = docs;
            });
            console.log("Data retrieved to mongo DB Successfully");
        }catch(e){
            console.log("Exception in DB Find "+e.message);
        }finally{
            console.log("closing db connection");
            mongoose.connection.close();
        }
    })
console.log("Returning dbRes,%j",dbResult);
    return dbResult;
    
    }


module.exports = router