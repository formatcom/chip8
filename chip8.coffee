args     = require('minimist')(process.argv.slice(2))
isNode   = require 'is-node'

Cpu     = require './cpu'
Display = require './display'
Rom     = require './rom'
Clock   = require './clock'

cpu     = new Cpu()
display = new Display 64, 32, 10
rom     = new Rom display.element
clock   = new Clock()

if isNode
  if !args.file then console.log 'require --file ROM'
  else
    rom.read(args.file, (err, data) ->
      cpu.load data
      clock.cycle ->
        cpu.execute()
        display.render cpu.screen
      clock.start()
    )
else
  document.body.appendChild display.element
  rom.read (err, data) ->
    cpu.load data
    window.cpu = cpu
    clock.cycle ->
      cpu.execute()
      display.render cpu.screen
    clock.start()
