# based loosely on Kris Kowal's es-5shim.js
# https://github.com/kriskowal/es5-shim/blob/master/es5-shim.js#L204
#
# due to space constraints, this version does not check function type or cast length to a number

map = (a) ->
  b = @
  d = []
  e = 0
  while e<b
    if e in b
      d[e] = call arguments[1], b[e], e++, b
    else
      d[e] = undefined
  return d

if [].map
  Array.prototype.map = map
  Uint8Array.prototype.map = map
  Uint16Array.prototype.map = map
