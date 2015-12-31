# Emulator CHIP-8

Cpu = ->
  ram  = new ArrayBuffer 0xFFF # 4kb
  @ram = new Uint8Array ram

  @v = new Uint8Array 16

  @i = 0x0000 # 16bit 

  @delay = 0x00 # 8bit
  @timer = 0x00 # 8bit

  @pc = 0x000 # 16bit

  @stack = new Uint16Array 16
  @sp = 0x00 # 8bit
  return

Cpu.prototype =
  load: (rom) -> @ram[address + 0x200] = byte for byte, address in rom

module.exports = Cpu
