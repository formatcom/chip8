Clock = ->

Clock.prototype =
  cycle: (hz, cycle) ->
    @hz    = hz
    @cycle = cycle
    if hz > 60 then @getRequestAnimationFrame = (interval) -> (callback) -> setTimeout(callback, interval)
  getRequestAnimationFrame: (interval) ->
    requestAnimationFrame       ||
    webkitRequestAnimationFrame ||
    mozRequestAnimationFrame    ||
    oRequestAnimationFrame      ||
    msRequestAnimationFrame     ||
    (callback) -> setTimeout(callback, interval)
  start: ->
    element = document.getElementById 'fps'
    interval = 1000/@hz
    animationFrame = @getRequestAnimationFrame interval
    self  = @
    start = progress = now = delta = frame = fps = 0
    _loop = (timestamp) ->
      timestamp = if timestamp then timestamp else Date.now()
      if !progress
        start = progress = timestamp
      now = timestamp
      delta = now - progress | 0
      if delta > interval
        progress = now - (delta % interval)
        fps = (++frame/((progress - start)/1000)) | 0
        element.innerHTML = "fps: #{fps}"
        self.cycle()
      animationFrame(_loop)
    animationFrame(_loop)

module.exports = Clock
