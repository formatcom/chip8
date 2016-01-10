isNode  = require 'is-node'
{gui}   = require 'nw'

Cpu     = require './cpu'
Display = require './display'
Rom     = require './rom'
Clock   = require './clock'

display = new Display 64, 32, 10
cpu     = new Cpu display
rom     = new Rom display.element
clock   = new Clock()

document.body.appendChild display.element
if isNode then gui.Window.get().show()

rom.read (err, data) ->
  window.cpu = cpu
  cpu.load data
  clock.cycle -> cpu.execute()
  clock.start()
