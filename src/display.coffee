Display = (id, width, height, exp=1, methodRender='renderPixel32bit') ->
  @element = document.getElementById id
  @element.width  = width*exp
  @element.height = height*exp
  @ctx = @element.getContext '2d'
  @ctx.fillStyle = '#FFF'
  @ctx.fillRect 0, 0, width*exp, height*exp
  @swidth  = width
  @sheight = height
  @cwidth  = width*exp
  @cheight = height*exp
  @exp    = exp
  @imgData   = @ctx.getImageData(0, 0, width*exp, height*exp)
  @data8bit  = @imgData.data
  buffer     = new ArrayBuffer @imgData.data.length
  @view8bit  = new Uint8ClampedArray buffer
  @view32bit = new Uint32Array buffer
  
  #https://es.wikipedia.org/wiki/Endianness
  @view32bit[0] = 0x0A0B0C0D
      
  @isLittleEndian = true
  if @view8bit[0] == 0x0A and @view8bit[1] == 0x0B and @view8bit[2] == 0x0C and @view8bit[3] == 0x0D then @isLittleEndian = false
  @render = @[methodRender]
  return

Display.prototype =
  clear: -> @ctx.clearRect 0, 0, @cwidth, @cheight
  renderPixel8bit: (screen) ->
    {ctx, cheight, cwidth, swidth, exp, data8bit, imgData} = @

    for y in [0...cheight] by 1
      for x in [0...cwidth] by 1
        pos = (y * cwidth + x) * 4
        sx = (x/exp)|0
        sy = (y/exp)|0
        px = screen[(sy*swidth+sx)]
        if px then value=0 else value=0xFF
        data8bit[pos]   = value
        data8bit[++pos] = value
        data8bit[++pos] = value
        data8bit[++pos] = 0xFF
    ctx.putImageData imgData, 0, 0
  renderPixel32bit: (screen) ->
    {ctx, cheight, cwidth, swidth, exp, imgData, data8bit, view8bit, view32bit, isLittleEndian} = @

    for y in [0...cheight] by 1
      for x in [0...cwidth] by 1
        pos = (y * cwidth + x)
        sx = (x/exp)|0
        sy = (y/exp)|0
        px = screen[(sy*swidth+sx)]
        if px then r=g=b=0 else r=g=b=0xFF
        a = 0xFF
        if isLittleEndian
          # RBGA -> AGBR
          value = (a << 24)|(g << 16)|(b << 8)|r
        else
          # RBGA
          value = (r << 24)|(b << 16)|(g << 8)|a
        view32bit[pos] = value
    data8bit.set view8bit
    ctx.putImageData imgData, 0, 0
  renderFillRect: (screen) ->
    {ctx, swidth, exp} = @
    for px, index in screen
      x = ((index % swidth) | 0) * exp
      y = ((index / swidth) | 0) * exp
      if px is 1 then ctx.fillStyle = '#000' else ctx.fillStyle = '#FFF'
      ctx.fillRect x, y, exp, exp

module.exports = Display
