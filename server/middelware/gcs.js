const { Storage } = require('@google-cloud/storage')
const fileType = require('file-type');
const CLOUD_BUCKET = process.env.CLOUD_BUCKET
const accepted_extensions = ['png','jpg','jpeg','tiff','psd'];
const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT,
    keyFilename: process.env.KEYFILE_PATH
})
const bucket = storage.bucket(CLOUD_BUCKET);

const getPublicUrl = (filename) => {
    return `https://storage.googleapis.com/${CLOUD_BUCKET}/${filename}`
}
const sendUploadToGCS = (req, res, next) => {
    if (!req.file) {
        return next()
    }

    const gcsname = Date.now() + req.file.originalname
    const file = bucket.file(gcsname)

    const stream = file.createWriteStream({
        metadata: {
            contentType: req.file.mimetype
        }
    })

    stream.on('error', (err) => {
        req.file.cloudStorageError = err
        next(err)
    })

    stream.on('finish', () => {
        req.file.cloudStorageObject = gcsname
        file.makePublic().then(() => {
            req.file.cloudStoragePublicUrl = getPublicUrl(gcsname)
            next()
        })
    })

    stream.end(req.file.buffer)
}

const Multer = require('multer'),
    multer = Multer({
        storage: Multer.MemoryStorage,
        limits: {
            fileSize: 5 * 1024 * 1024
        },
        fileFilter : (req,file, cb)=>{
            // if(acceep)
            if (accepted_extensions.some(ext => file.originalname.endsWith("." + ext))) {
                return cb(null, true);
            }

            return  cb(new Error('Only ' + accepted_extensions.join(", ") + ' files are allowed!')); 
        }
        // dest: '../images'
})

function validate_format(req, res, next) {
    // For MemoryStorage, validate the format using `req.file.buffer`
    // For DiskStorage, validate the format using `fs.readFile(req.file.path)` from Node.js File System Module
    if(!req.file){
        return next()
    }
    let mime = fileType(req.file.buffer);

    // if can't be determined or format not accepted
    if(!mime || !accepted_extensions.includes(mime.ext))
        return next(new Error('The uploaded file is not in ' + accepted_extensions.join(", ") + ' format!'));
    
    next();
}

const { Article } = require('../models')
const urlToFileName = require('../helpers/urlTofileName')
async function deleteFile(req,res,next) {
    // const image = req.file ? req.file.cloudStoragePublicUrl : ''
    if(!req.file){
        return next()
    }
    Article.findById(req.params.id)
    .then(data=>{
        let filename =  data.featured_image
        filename = urlToFileName(filename)
        return storage
        .bucket(CLOUD_BUCKET)
        .file(filename)
        .delete()
    })
    .then(_=>{
        next()
    })
    .catch(next)

    // storage.bucket(CLOUD_BUCKET).file(filename).delete()
    // try{
    //  await storage
    //  .bucket(CLOUD_BUCKET)
    //  .file(filename)
    //  .delete();
    //  next()
    // //  res.status(200).json({
    // //    message : "successfully deleted in storage"
    // //  })
    // } 
    // catch{
    //     next({ status : 500 })
    // //   res.status(500).json("hapus bro")
    // }
   
   }

module.exports = {
    getPublicUrl,
    sendUploadToGCS,
    multer ,
    validate_format,
    deleteFile
}