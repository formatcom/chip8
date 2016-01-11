# Emulator CHIP-8
require './polyfill' # soport Array.prototype.map

decTo = require './decTo'

Cpu = (display) ->
  ram  = new ArrayBuffer 0xFFF # 4kb
  @ram = new Uint8Array ram

  @v = new Uint8Array 16

  @i = 0 # 16bit 

  @dt = 0 # 8bit
  @st = 0 # 8bit

  @pc = 0x200 # 16bit

  @stack = new Uint16Array 16
  @sp = 0 # 8bit

  @display  = display
  @screen   = new Array(64*32)
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
NULL = -> console.log "NULL->Instruction: #{decTo.hex(@opcode)}"
CLS_RET = ->
  {kk} = @
  if kk == 0xE0
    console.log "0xE0->Instruction: CLS #{decTo.hex(@opcode)}"
    @screen = @screen.map (px) -> 0
    @display.clear()
  else if kk == 0xEE
    console.log "00EE->Instruction: RET #{decTo.hex(@opcode)}"
    @pc = @stack[--@sp & 0xF]
CALL_addr = ->
  console.log "2NNN->Instruction: CALL addr #{decTo.hex(@opcode)}"
  @stack[@sp++ & 0xF] = @pc
  @pc = @nnn
LD_Vx_byte = ->
  console.log "6XKK->Instruction: LD Vx, byte #{decTo.hex(@opcode)}"
  @v[@x] = @kk
ADD_Vx_byte = ->
  console.log "7XKK->Instruction: ADD Vx, byte #{decTo.hex(@opcode)}"
  @v[@x] += @kk
LD_Vx_Vy = ->
  console.log "8XY0->Instruction: LD Vx, Vy #{decTo.hex(@opcode)}"
  @v[@x] = @v[@y]
ARITHMETIC = -> @arithmetic[@n].call @
LD_I_addr = ->
  console.log "ANNN->Instruction: LD I, addr #{decTo.hex(@opcode)}"
  @i = @nnn
DRW_Vx_Vy_nibble = ->
  console.log "DXYN->Instruction: DRW Vx, Vy, nibble #{decTo.hex(@opcode)}"
  {v, x, y, n, i, ram} = @
  @v[0xF] = 0
  for address in [0..n-1]
    sprite = ram[address+i]
    for index in [0..7]
      sx  = (v[x] + index)   & 63
      sy  = (v[y] + address) & 31
      pos = 64 * sy + sx
      px  = (sprite & (1 << (7-index))) != 0
      @v[0xF] |= @screen[pos] & px
      @screen[pos] ^= px
  @display.render @screen
CPU_Extra = -> @extra[@y].call @
FX07_0A = ->
  {kk, dt, x} = @
  if kk==0x07
    console.log "FX07->Instruction: LD Vx, DT #{decTo.hex(@opcode)}"
    @v[x] = dt
  else if kk==0x0A
    console.log "FAIL->Instruction: LD Vx, K #{decTo.hex(@opcode)}"
FX15_18_1E = ->
  {kk} = @
  if kk == 0x15
    console.log "FX15->Instruction: LD DT, Vx #{decTo.hex(@opcode)}"
    @dt = @v[@x]
  else if kk == 0x18
    console.log "FAIL->Instruction: LD ST, Vx #{decTo.hex(@opcode)}"
  else if kk == 0x1E
    console.log "FAIL->Instruction: ADD I, Vx #{decTo.hex(@opcode)}"
LD_F_Vx = ->
  console.log "FX29->Instruction: LD F, Vx #{decTo.hex(@opcode)}"
  @i = @v[@x] * 5
LD_B_Vx = ->
  console.log "FX33->Instruction: LD B, Vx #{decTo.hex(@opcode)}"
  @ram[@i]   = @v[@x]/100
  @ram[@i+1] = (@v[@x]/10)%10
  @ram[@i+2] = @v[@x]%10
LD_Vx_I = ->
  console.log "FX65->Instruction: LD Vx, [I] #{decTo.hex(@opcode)}"
  @v[address] = @ram[@i+address] for address in [0..@x]

Cpu.prototype =
  init: ->
    @ram = @ram.map (byte) -> 0
    @screen = @screen.map (px) -> 0
    @v = @v.map (byte) -> 0
    @stack = @stack.map (_2bytes) -> 0
    @i  = @dt = @st = @sp = 0
    @pc = 0x200
    @ram[address] = byte for byte, address in @hexChars
      
  table: [
    CLS_RET, NULL, CALL_addr, NULL, NULL, NULL, LD_Vx_byte, ADD_Vx_byte
    ARITHMETIC, NULL, LD_I_addr, NULL, NULL, DRW_Vx_Vy_nibble, NULL, CPU_Extra
  ]

  extra: [
    FX07_0A, FX15_18_1E, LD_F_Vx, LD_B_Vx, NULL, NULL, LD_Vx_I, NULL
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
  ]

  arithmetic: [
    LD_Vx_Vy, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
  ]

  load: (rom) -> @ram[address + 0x200] = byte for byte, address in rom

  fetch: ->
    {ram, pc} = @
    @opcode = (ram[pc]<<8) + ram[pc+1] # 16bit
    @pc +=2
    
  execute: ->
    @fetch()
    address = (@opcode&0xF000)>>12

    @nnn =  @opcode&0x0FFF
    @kk  =  @nnn&0x0FF
    @n   =  @kk&0x0F
    @x   = (@nnn&0xF00) >> 8
    @y   = (@nnn&0x0F0) >> 4
    
    @table[address].call @

    @dt = @dt-1 if @dt
    if @st
      if --@st is 0
        console.info 'beep'

module.exports = Cpu
