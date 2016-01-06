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

  @screen   = [64*32]
  @hexChars = [
    0xF0, 0x90, 0x90, 0x90, 0xF0 # 0
    0x20, 0x60, 0x20, 0x20, 0x70 # 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0 # 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0 # 3
    0x90, 0x90, 0xF0, 0x10, 0x10 # 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0 # 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0 # 6
    0xF0, 0x10, 0x20, 0x40, 0x40 # 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0 # 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0 # 9
    0xF0, 0x90, 0xF0, 0x90, 0x90 # A
    0xE0, 0x90, 0xE0, 0x90, 0xE0 # B
    0xF0, 0x80, 0x80, 0x80, 0xF0 # C
    0xE0, 0x90, 0x90, 0x90, 0xE0 # D
    0xF0, 0x80, 0xF0, 0x80, 0xF0 # E
    0xF0, 0x80, 0xF0, 0x80, 0x80 # F
  ]

  @init()
  return

# Instructions Chip8
NULL = -> console.log "NULL->Instruction: #{decToHex(@opcode)}"
CLS_RET = ->
  {kk} = @
  if kk == 0xE0
    console.log "FAIL->Instruction: #{decToHex(@opcode)}"
  else if kk == 0xEE
    console.log "00EE->Instruction: #{decToHex(@opcode)}"
    @screen = @screen.map (px) -> 0
CALL_addr = ->
  console.log "2NNN->Instruction: CALL addr #{decToHex(@opcode)}"
  @stack[@sp++] = @pc
  @pc = @nnn
LD_Vx_byte = ->
  console.log "6XKK->Instruction: LD Vx, byte #{decToHex(@opcode)}"
  @v[@x] = @kk
ADD_Vx_byte = ->
  console.log "7XKK->Instruction: ADD Vx, byte #{decToHex(@opcode)}"
  @v[@x] += @kk
LD_I_addr = ->
  console.log "ANNN->Instruction: LD I, addr #{decToHex(@opcode)}"
  @i = @nnn
DRW_Vx_Vy_nibble = ->
  console.log "FAIL->Instruction: DRW Vx, Vy, nibble #{decToHex(@opcode)}"
CPU_Extra = -> @extra[@y].call @
LD_F_Vx = ->
  console.log "FX29->Instruction: LD F, Vx #{decToHex(@opcode)}"
  @i = @v[@x] * 5
LD_B_Vx = ->
  console.log "FX33->Instruction: LD B, Vx #{decToHex(@opcode)}"
  @ram[@i]   = @x/100
  @ram[@i+1] = (@x/10)%10
  @ram[@i+2] = @x%10
LD_Vx_I = ->
  console.log "FX65->Instruction: LD Vx, [I] #{decToHex(@opcode)}"
  @v[address] = @ram[@i] for address in [0..@x]
    
Cpu.prototype =
  init: ->
    @ram = @ram.map (byte) -> 0
    @v = @v.map (byte) -> 0
    @stack = @stack.map (_2bytes) -> 0
    @i  = @delay = @timer = @sp = 0
    @pc = 0x200
    @ram[address] = byte for byte, address in @hexChars
      
  table: [
    CLS_RET, NULL, CALL_addr, NULL, NULL, NULL, LD_Vx_byte, ADD_Vx_byte
    NULL, NULL, LD_I_addr, NULL, NULL, DRW_Vx_Vy_nibble, NULL, CPU_Extra
  ]

  extra: [
    NULL, NULL, LD_F_Vx, LD_B_Vx, NULL, NULL, LD_Vx_I
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
    @n   =  @kk&0x0F
    @x   = (@nnn&0xF00) >> 8
    @y   = (@nnn&0x0F0) >> 4
    
    @table[address].call @

module.exports = Cpu

