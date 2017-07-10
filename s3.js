const AWS       =   require('aws-sdk'),
    config      =   require('dotenv').config()
    zlib        =   require('zlib'),
    fs          =   require('fs'),
    getUri      =   require('get-uri'),
    Promise     =   require('bluebird'),
    Logger      =   require('./logger'),
    debug       =   false



let s3Stream    =   {}
let s3Utils     =   {
  checkEnvReqs : function () {
    // Check Config for required key value pairs
    if (!process.env.AWS_ACCESS_KEY) {
      console.error('! AWS_ACCESS_KEY required as environmental variable')
      return false
    }
    else if (!process.env.AWS_SECRET_KEY) {
      console.error('! AWS_SECRET_KEY required as environmental variable')
      return false
    }
    else if (!process.env.S3_BUCKET_NAME) {
      console.error('! S3_BUCKET_NAME required as environmental variable')
      return false
    }
    else if (!process.env.AWS_MAX_PART_SIZE) {
      console.error('! AWS_MAX_PART_SIZE required as environmental variable')
      return false
    }
    else if (!process.env.AWS_MAX_CONCURRENT_PARTS) {
      console.error('! AWS_MAX_CONCURRENT_PARTS required as environmental variable')
      return false
    }
    else return true
  },
  setAwsConfig : function () {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY
    })
    s3Stream = require('s3-upload-stream')(new AWS.S3())
  },
  putToBucket : function (assetUri, folderName) {
    Logger.info('Put to AWS : ', assetUri)

    let putP = new Promise((resolve,reject) => {

      const filename = assetUri.substring(assetUri.lastIndexOf('/')+1),
            keyPath = (folderName) ? folderName + '/' + filename : filename

      Logger.info('Upload with Keypath : ', keyPath)

      let upload      =   s3Stream.upload({
        'Bucket': process.env.S3_BUCKET_NAME,
        'Key': keyPath
      })

      // Additional configuration
      upload.maxPartSize(process.env.AWS_MAX_PART_SIZE)
      upload.concurrentParts(process.env.AWS_MAX_CONCURRENT_PARTS)

      // Handle Errors
      upload.on('error', function (err) {
        console.error('! S3 Upload Error : ', err)
        reject(err)
      })

      /* Handle progress. Example details object:
         { ETag: ''f9ef956c83756a80ad62f54ae5e7d34b'',
           PartNumber: 5,
           receivedSize: 29671068,
           uploadedSize: 29671068 }
      */
      upload.on('part', function (details) {
        if (debug) Logger.info('Part Info : ', details)
      })

      /* Handle upload completion. Example details object:
         { Location: 'https://bucketName.s3.amazonaws.com/filename.ext',
           Bucket: 'bucketName',
           Key: 'filename.ext',
           ETag: ''bf2acbedf84207d696c8da7dbb205b9f-5'' }
      */
      upload.on('uploaded', function (details) {
        Logger.info('----- S3 Upload Success -----',
          '\n', details,
          '\n----- end : s3 upload info -----')
        resolve(details)
      })

      getUri(assetUri, function (err, rs) {
        if (err) throw err
        // Pipe the incoming filestream through compression, and up to S3.
        rs.pipe(upload)
      })
    })

    return putP
  }
}

// Setup s3 configuration if environmental configuration is OK
if (s3Utils.checkEnvReqs()) s3Utils.setAwsConfig()

module.exports = s3Utils
