// based loosely on Kris Kowal's es-5shim.js
// https://github.com/kriskowal/es5-shim/blob/master/es5-shim.js#L204
//
// due to space constraints, this version does not check function type or cast length to a number

var map = function(a){
  for (
    var b = this      // cache `this` and
      , c = b.length  // the array's length,
      , d = []        // create the return array
      , e = 0         // and initialize the cursor,
      , f             // and cache undefined.
      ; e < b;        // while the cursor is less than the length
  ) d[e] =            // set the result member
    e in b            // if it originally exists,
      ? a.call(       // to the given function, called with
        arguments[1], // the optional scope,
        b[e],         // existing member,
        e++,          // member index, and
        b )           // current scope,
      : f;            // or to undefined otherwise.
    return d          // return the result.
};


if ([].map){
  Array.prototype.map = map;
  Uint8Array.prototype.map = map;
  Uint16Array.prototype.map = map;
}
