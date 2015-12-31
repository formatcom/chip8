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
cpuNULL = -> console.log "Instruction: NULL #{decToHex(@opcode)}"
cpu6XKK = ->
  console.log "Instruction: LD Vx, byte #{decToHex(@opcode)}"
  @v[@x] = @kk
cpuANNN = ->
  console.log "Instruction: LD I, addr #{decToHex(@opcode)}"
  @i = @nnn
cpuDXYN = ->
  console.log "Instruction: DRW Vx, Vy, nibble #{decToHex(@opcode)}"

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
    cpuNULL, cpuNULL, cpuANNN, cpuNULL, cpuNULL, cpuDXYN, cpuNULL, cpuNULL
  ]
  
  load: (rom) -> @ram[address + 0x200] = byte for byte, address in rom

  fetch: ->
    {ram, pc} = @
    @opcode = (ram[pc]<<8) + ram[pc+1] # 16bit
    @pc += 2

  execute: ->
    @fetch()
    address = (@opcode&0xF000)>>12

    @nnn =  @opcode&0x0FFF
    @kk  =  @nnn&0x0FF
    @x   = (@nnn&0xF00) >> 8
    @y   = (@nnn&0x0F0) >> 4
    
    @table[address].call @

module.exports = Cpu

