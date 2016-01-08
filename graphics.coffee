isNode = require 'is-node'
Canvas = require 'canvas'

Graphics = (width, height, exp=1) ->
  if !isNode
    @element = document.createElement 'canvas'
    @element.width  = width*exp
    @element.height = height*exp
  else
    @element = new Canvas(width*exp, height*exp)
  @ctx = @element.getContext '2d'
  @width  = width
  @height = height
  @exp = exp
  @ctx.fillStyle = '#FFF'
  @ctx.fillRect 0, 0, @element.width, @element.height
  return

Graphics.prototype =
  clear: -> @ctx.clearRect 0, 0, @canvas.width, @canvas.height
  render: (screen) ->
    {ctx, width, exp} = @
    for px, index in screen
      x = (index % width) * exp
      y = ((index / width) | 0) * exp
      ctx.fillRect x, y, exp, exp

module.exports = Graphics
