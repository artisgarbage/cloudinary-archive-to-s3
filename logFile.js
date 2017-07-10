let logFile = {
  name : '',
  getFile : function() {
    return this.name
  },
  setFile : function(newFilename) {
    this.name = newFilename
    return this.name
  }
}


module.exports = logFile
