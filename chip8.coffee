args = require('minimist')(process.argv.slice(2))
decToHex = require './decToHex'

Cpu  = require './cpu'
Rom  = require './rom'

cpu = new Cpu()
rom = new Rom()

if !args.file then console.log 'require --file ROM'
else
  cpu.load rom.read(args.file)
  cpu.execute() for cycle in [0..20]
  console.log 'i:',     decToHex cpu.i
  console.log 'pc:',    decToHex cpu.pc
  console.log 'stack:', cpu.stack
  console.log 'sp:',    decToHex cpu.sp
  console.log 'v:',     cpu.v
