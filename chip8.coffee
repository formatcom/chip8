args = require('minimist')(process.argv.slice(2))

Cpu  = require './cpu'
Rom  = require './rom'

cpu = new Cpu()
rom = new Rom()

if !args.file then console.log 'require --file ROM'
else
  cpu.load rom.read(args.file)
  cpu.execute() for cycle in [0..10]
  console.log cpu.v
