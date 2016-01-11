module.exports =
  bin: (dec, base=2)  -> dec.toString(base)
  oct: (dec, base=8)  -> dec.toString(base)
  hex: (dec, base=16) -> dec.toString(base).toUpperCase()
