{readFileSync} = require 'fs'

Rom = ->

Rom.prototype =
  read: (file) -> console.log file
  

module.exports = Rom
