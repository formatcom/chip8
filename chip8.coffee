args = require('minimist')(process.argv.slice(2))

Cpu  = require './cpu'
Rom  = require './rom'

cpu = new Cpu()
rom = new Rom()

if args.file then cpu.load rom.read(args.file) else console.log 'require --file ROM'
