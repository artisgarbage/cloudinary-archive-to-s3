# Cloudinary Archive Util
by CP+B / Anthony Chavez

Utility for archiving Cloudinary assets to S3

### Table of Contents
<!-- MarkdownTOC -->

- Installation / Setup
- Usage
  - CLI
  - Node Module

<!-- /MarkdownTOC -->



# Installation / Setup

- Requires [Node.js](http://www.nodejs.com)
- Clone this repo
- Run `npm install` within the repo directory
- Create an .env file in the root directory of the repo
  - Update with your Cloudinary and AWS info
  **Sample .env file**
  ```
  CLOUDINARY_CLOUD_NAME=O0iFNzd1D915wtuhFQOaCCOgGWYtL
  CLOUDINARY_API_KEY=19323379122526
  CLOUDINARY_API_SECRET=FVrfXikLmCQyqCy3zSoiTRHPVIeIKwOXJnt
  CLOUDINARY_DELETE=true

  AWS_ACCESS_KEY=xTE8u7SB0qdm7il2avpgbj7fS
  AWS_SECRET_KEY=5exA2X3nHjiBk380HCUzubVprAKv1mJG8Rs
  AWS_MAX_PART_SIZE=20971520
  AWS_MAX_CONCURRENT_PARTS=5

  S3_BUCKET_NAME=my-cloudinary-archive-bucket

  BACKUP_TO_FOLDER=true
  BACKUP_FOLDERNAME_USE_TIME=true
  BACKUP_FOLDERNAME_PREFIX=backup
  ```



# Usage


## CLI

```node example.js --start_at="May 1, 2017 00:00:00"  --max_results=1```
(note how CLI arguments take precedence over local vars in example.js)

OR
```./archiver --start_at="May 1, 2017 00:00:00"  --max_results=3```
(as an aliasable CLI utility, just add to your PATH)

OR
FUTURE
```./archiver --asset_id="QwmWBRIGrNFt499yUCqH1Z7O6xOIlbU8oM"```

### Parameters

**max_results**
Maximum number of records to return from Cloudinary

**start_at**
Date from which to begin the archive of (older) Cloudinary assets


## Node Module

```node example.js```

### Exports
cldnryArchvr

### Main Public Methods
```javascript
cldnryArchvr.archiveAssets(start_at, max_results) // Returns a Bluebird promise
archiver.archiveAsset(cldnry_asset_id)
//...and more...
```
See [Parameters](#parameters)

**Example**
```javascript
const archiver = require('./cldnryArchvr')

const start_at          =   'May 1, 2017 00:00:00'
const max_results       =   3
const cldnry_asset_id   =   EvBMTydMswybJ3ve2IpbmZUqXyeoqxt8W3en4Y

// Archive {max_results} many items older than {start_at}
archiver.archiveAssets(start_at, max_results)

// FUTURE
// Archive a specific asset by Cloudinary ID
archiver.archiveAsset(cldnry_asset_id)
```
