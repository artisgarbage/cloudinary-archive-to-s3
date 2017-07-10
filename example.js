const archiver = require('./cldnryArchvr')

let start_at      =   "May 1, 2017 00:00:00",
    max_results   =   3

archiver.archiveAssets(start_at, max_results)
  .then(() => {
    console.log('Hoorah, archive success!')
  }).catch((err) => {
    console.log('Oops, something went wrong', err)
  })
