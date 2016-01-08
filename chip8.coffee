args     = require('minimist')(process.argv.slice(2))
isNode   = require 'is-node'
decToHex = require './decToHex'

Cpu      = require './cpu'
Graphics = require './graphics'
Rom      = require './rom'

cpu      = new Cpu()
graphics = new Graphics 64, 32, 10
rom      = new Rom graphics.element

clock = (cpu, rom) ->
  cpu.load(rom)
  cpu.execute() for cycle in [0..30]

if isNode
  if !args.file then console.log 'require --file ROM'
  else rom.read(args.file, (err, data) -> clock cpu, data)
else
  document.body.appendChild graphics.element
  rom.read((err, data) -> clock cpu, data)
