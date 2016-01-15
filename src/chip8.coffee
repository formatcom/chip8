isNode  = require 'is-node'
{gui}   = require 'nw'

Cpu     = require './cpu'
Display = require './display'
Rom     = require './rom'
Clock   = require './clock'

display = new Display 'canvas', 64, 32, 6, 'renderPixel32bit'
cpu     = new Cpu display
rom     = new Rom display.element
clock   = new Clock()

if isNode then gui.Window.get().show()

rom.read (err, data) ->
  window.cpu = cpu
  cpu.init()
  cpu.load data
  clock.cycle 60, -> cpu.execute()
  clock.start()
