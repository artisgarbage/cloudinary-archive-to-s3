const argv      =   require('yargs').argv,
    config      =   require('dotenv').config(),
    cloudinary  =   require('cloudinary'),
    Promise     =   require('bluebird'),
    s3Utils     =   require('./s3')



let cldnryArchvr = {
  startAt : '',
  maxResults : 0,
  uploadPath : '',
  checkEnvReqs : function() {
    // Check Config for required key value pairs
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.error('! CLOUDINARY_CLOUD_NAME required as environmental variable')
      return false
    }
    else if (!process.env.CLOUDINARY_API_KEY) {
      console.error('! CLOUDINARY_API_KEY required as environmental variable')
      return false
    }
    else if (!process.env.CLOUDINARY_API_SECRET) {
      console.error('! CLOUDINARY_API_SECRET required as environmental variable')
      return false
    }
    else if (!process.env.AWS_ACCESS_KEY) {
      console.error('! AWS_ACCESS_KEY required as environmental variable')
      return false
    }
    else if (!process.env.AWS_ACCESS_KEY) {
      console.error('! AWS_ACCESS_KEY required as environmental variable')
      return false
    }
    else return true
  },
  checkParamReqs : function(start_at, max_results) {
    // Check for required arguments
    if (!argv.start_at && !start_at) {
      console.error('! start_at argument required to archive assets')
      return false
    }
    else if (!argv.max_results && !max_results) {
      console.error('! max_results argument required to archive assets')
      return false
    }
    else {
      this.startAt = (argv.start_at) || start_at
      this.startAt = new Date(this.startAt)
      this.maxResults = (argv.max_results) || max_results
      // Check out-of-bounds max_results
      if (this.maxResults < 0 || this.maxResults > 500) {
        console.error('! max_results must be between 0 and 500')
        return false
      }
      else return true
    }
  },
  setUploadPath : function () {
    let path = ''
    if (process.env.BACKUP_TO_FOLDER === 'true') {
      path = (process.env.BACKUP_FOLDERNAME_PREFIX) ? process.env.BACKUP_FOLDERNAME_PREFIX : 'bak'
      if (process.env.BACKUP_FOLDERNAME_USE_TIME === 'true') {
        path = path + '-' + Date.now()
      }
    }
    this.uploadPath = path
    console.log('Upload Path : ', this.uploadPath)
    return this.uploadPath
  },
  setCloudinaryConfig : function() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    })
    return true
  },
  init : function() {
    this.setCloudinaryConfig()
    this.setUploadPath()
  },
  archiveAssets : function (start_at, max_results) {
    let mainArchiveP = new Promise((resolve, reject) => {
      if (argv.asset_id) {
        console.log('Archive Asset with ID : ', argv.asset_id)
        this.getCloudinaryObjById(argv.asset_id)
          .bind(this)
          .then(this.archiveEntireAssetsList)
          .then((res) => {
            console.log('*** Successfully archived single asset ***')
            resolve()
          })
          .catch(err => {
            console.error('! Errored archiving single asset', err)
            reject('! Errored archiving single asset', err)
          })
      }
      else if (this.checkEnvReqs() && this.checkParamReqs(start_at, max_results)) {
        this.listAssetsFromCloudinary()
          .bind(this)
          .then(this.archiveEntireAssetsList)
          .then((res) => {
            console.log('*** Successfully archived all assets ***')
            resolve()
          })
          .catch(err => {
            console.error('! Errored archiving assets', err)
            reject('! Errored archiving assets', err)
          })
      } else {
        console.error('! Configuration requirements NOT satisfied')
      }
    })
    return mainArchiveP
  },
  archiveSpecific : function(publicId) {
    let archiveP = new Promise((resolve, reject) => {
      console.log('Archive Specific Asset with ID : ', publicId)
        this.getCloudinaryObjById(publicId)
          .bind(this)
          .then(this.archiveEntireAssetsList)
          .then((res) => {
            console.log('*** Successfully archived single asset ***')
            resolve()
          })
          .catch(err => {
            console.error('! Errored archiving single asset', err)
            reject('! Errored archiving single asset', err)
          })
    })
    return archiveP
  },
  archiveAssetById : function(resourceObj) {
    console.log('----- Archive Cloudinary Asset -----')
    let archiveP = new Promise((resolve,reject) => {
      if (!resourceObj) {
        reject('! A Cloudinary object with a  pblic_id key is required for archiving')
      }
      else {
        console.log('Archive Asset ID : ', resourceObj.public_id,
          '\nArchive Asset URL : ', resourceObj.url,
          '\nAsset Created At : ', resourceObj.created_at)

        s3Utils.putToBucket(resourceObj.url, this.uploadPath)
          .bind(this)
          .then(() => {
            // Delete from Cloudinary, but don't reject promise if errors on Cloudinary delete
            this.deleteFromCloudinary(resourceObj.public_id)
              .then(resolve)
              .catch(err => {
                console.error('! Error deleting asset from Cloudinary')
              })
          })
          .catch(err => {
            reject('! Error archiving asset by ID', err)
          })
      }
    })
    return archiveP
  },
  archiveEntireAssetsList : function(cloudinaryResponse) {
    const assets = cloudinaryResponse.resources

    let allArchivesP = new Promise((resolve, reject) => {
      let archivePromises = []
      for (let i = assets.length - 1; i >= 0; i--) {
        archivePromises.push(this.archiveAssetById(assets[i]))
      }
      Promise.all(archivePromises)
        .then(resolve)
        .catch(reject)
    })
    return allArchivesP
  },
  getCloudinaryObjById : function (resourceId) {
    console.log('Get Cloudinary Obj by ID : ', resourceId)
    let listP = new Promise((resolve, reject) => {
      cloudinary.api.resources_by_ids(resourceId, (res, err) => {
        if (err) reject()
        resolve(res)
      })
    })
    return listP
  },
  listAssetsFromCloudinary : function() {
    let listP = new Promise((resolve,reject) => {
      console.log(this.startAt, this.maxResults)
      cloudinary.api.resources((res) => {
        console.log('Rate limit allowed : ', res.rate_limit_allowed,
          '\nRate limit remaining requests :', res.rate_limit_remaining,
          '\nRate limit resets at : ', res.rate_limit_reset_at)
        resolve(res)
      }, {
        start_at: this.startAt,
        max_results : this.maxResults,
        direction : 1
      })
    })
    return listP
  },
  getFromCoundinary : function () {
    console.log('Get single asset from Cloudinary')
  },
  deleteFromCloudinary : function(assetId) {
    let delP = new Promise((resolve, reject) => {
      if (process.env.CLOUDINARY_DELETE === 'true') {
        console.log('Delete Cloudinary Asset : ', assetId)
        cloudinary.api.delete_resources(assetId, (res, err) => {
          if (err) {
            reject()
          } else {
            console.log('Cloudinary Deleted : ', res.deleted)
            resolve()
          }
        })
      }
      else {
        console.log('Opted out of Cloudinary delete...')
        resolve()
      }
    })
    return delP
  },
  writeLog : function () {
    console.log('Write to log')
  }
}

// Setup cloudinary connection if environmental configuration is OK
if (cldnryArchvr.checkEnvReqs()) cldnryArchvr.init()

module.exports = cldnryArchvr
