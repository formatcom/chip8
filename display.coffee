Display = (width, height, exp=1) ->
  @element = document.createElement 'canvas'
  @element.width  = width*exp
  @element.height = height*exp
  @ctx = @element.getContext '2d'
  @width  = width
  @height = height
  @exp = exp
  @ctx.fillStyle = '#FFF'
  @ctx.fillRect 0, 0, @element.width, @element.height
  return

Display.prototype =
  clear: -> @ctx.clearRect 0, 0, @canvas.width, @canvas.height
  render: (screen) ->
    {ctx, width, exp} = @
    for px, index in screen
      x = (index % width) * exp
      y = ((index / width) | 0) * exp
      if px is 1 then ctx.fillStyle = '#000' else ctx.fillStyle = '#FFF'
      ctx.fillRect x, y, exp, exp
      
module.exports = Display
