args = require('minimist')(process.argv.slice(2))

Cpu  = require './cpu'
Rom  = require './rom'

cpu = new Cpu()
rom = new Rom()

rom.read(args.file)
