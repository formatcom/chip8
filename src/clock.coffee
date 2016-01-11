Clock = ->

Clock.prototype =
  cycle: (cycle) -> @cycle = cycle
  getRequestAnimationFrame: (interval) ->
    requestAnimationFrame       ||
    webkitRequestAnimationFrame ||
    mozRequestAnimationFrame    ||
    oRequestAnimationFrame      ||
    msRequestAnimationFrame     ||
    (callback) -> setTimeout(interval, callback)
  start: ->
    animationFrame = @getRequestAnimationFrame()
    self = @
    _loop = ->
      self.cycle()
      animationFrame(_loop)
    animationFrame(_loop)

module.exports = Clock
