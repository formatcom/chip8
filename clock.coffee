Clock = ->

Clock.prototype =
  cycle: (cycle) -> @cycle = cycle
  getRequestAnimationFrame: ->
    requestAnimationFrame       ||
    webkitRequestAnimationFrame ||
    mozRequestAnimationFrame    ||
    oRequestAnimationFrame      ||
    msRequestAnimationFrame
  start: ->
    animationFrame = @getRequestAnimationFrame()
    self = @
    _loop = ->
      self.cycle()
      animationFrame(_loop)
    animationFrame(_loop)

module.exports = Clock
