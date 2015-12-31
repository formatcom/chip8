{readFileSync} = require 'fs'

Rom = ->

Rom.prototype =
  read: (file) -> @buffer = readFileSync file
  

module.exports = Rom
