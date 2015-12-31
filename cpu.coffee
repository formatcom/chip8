# Emulator CHIP-8
decToHex = require './decToHex'

Cpu = ->
  ram  = new ArrayBuffer 0xFFF # 4kb
  @ram = new Uint8Array ram

  @v = new Uint8Array 16

  @i = 0 # 16bit 

  @delay = 0 # 8bit
  @timer = 0 # 8bit

  @pc = 0x200 # 16bit

  @stack = new Uint16Array 16
  @sp = 0 # 8bit

  return

# Instructions Chip8
cpuNULL = (opcode) -> console.log "Instruction: NULL #{decToHex(opcode)}"
cpu6XKK = (opcode) ->
  console.log "Instruction: LD Vx, byte #{decToHex(opcode)}"
  kk = opcode&0x00FF
  console.log decToHex(kk)

Cpu.prototype =
  init: ->
    @ram.map (byte) ->
      byte = 0
    @v.map (byte) ->
      byte = 0
    @stack.map (_2bytes) ->
      _2bytes = 0
    @i  = @delay = @timer = @sp = 0
    @pc = 0x200

  table: [
    cpuNULL, cpuNULL, cpuNULL, cpuNULL, cpuNULL, cpuNULL, cpu6XKK, cpuNULL
    cpuNULL, cpuNULL, cpuNULL, cpuNULL, cpuNULL, cpuNULL, cpuNULL, cpuNULL
  ]
  
  load: (rom) -> @ram[address + 0x200] = byte for byte, address in rom

  fetch: ->
    {ram, pc} = @
    opcode = (ram[pc]<<8) + ram[pc+1] # 16bit
    @pc += 2
    return opcode

  execute: ->
    opcode  = @fetch()
    address = (opcode&0xF000)>>12
    @table[address](opcode)

module.exports = Cpu

