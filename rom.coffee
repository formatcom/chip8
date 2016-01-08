isNode  = require 'is-node'
{readFile} = require 'fs'

Rom = (dropZone) ->
  if !isNode then @dropZone = dropZone
  return

Rom.prototype =
  read: (src, callback) ->
    if arguments.length is 1 and !isNode then callback = src
    if isNode
      readFile(src, (err, data) ->
        if err then callback(err) else callback(null, data)
      )
    else
      @handleFileSelect = (event) ->
        event.stopPropagation()
        event.preventDefault()

        file = event.dataTransfer.files[0]
        reader = new FileReader()
        reader.readAsArrayBuffer(file)
        reader.onload  = (event) -> callback(null, new Uint8Array(@result))
        reader.onerror = (event) -> callback(event)
      @handleDragOver = (event) ->
        event.stopPropagation()
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      @dropZone.addEventListener('dragover', @handleDragOver,   false)
      @dropZone.addEventListener('drop',     @handleFileSelect, false)

module.exports = Rom
