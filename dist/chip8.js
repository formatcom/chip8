(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Clock, Cpu, Display, Rom, clock, cpu, display, gui, isNode, rom;

isNode = require('is-node');

gui = require('nw').gui;

Cpu = require('./cpu');

Display = require('./display');

Rom = require('./rom');

Clock = require('./clock');

display = new Display(64, 32, 10);

cpu = new Cpu(display);

rom = new Rom(display.element);

clock = new Clock();

document.body.appendChild(display.element);

if (isNode) {
  gui.Window.get().show();
}

rom.read(function(err, data) {
  window.cpu = cpu;
  cpu.load(data);
  clock.cycle(function() {
    return cpu.execute();
  });
  return clock.start();
});


},{"./clock":2,"./cpu":3,"./display":5,"./rom":13,"is-node":9,"nw":10}],2:[function(require,module,exports){
var Clock;

Clock = function() {};

Clock.prototype = {
  cycle: function(cycle) {
    return this.cycle = cycle;
  },
  getRequestAnimationFrame: function(interval) {
    return requestAnimationFrame || webkitRequestAnimationFrame || mozRequestAnimationFrame || oRequestAnimationFrame || msRequestAnimationFrame || function(callback) {
      return setTimeout(interval, callback);
    };
  },
  start: function() {
    var _loop, animationFrame, self;
    animationFrame = this.getRequestAnimationFrame();
    self = this;
    _loop = function() {
      self.cycle();
      return animationFrame(_loop);
    };
    return animationFrame(_loop);
  }
};

module.exports = Clock;


},{}],3:[function(require,module,exports){
var ADD_Vx_byte, ARITHMETIC, CALL_addr, CLS_RET, CPU_Extra, Cpu, DRW_Vx_Vy_nibble, FX15_18_1E, LD_B_Vx, LD_F_Vx, LD_I_addr, LD_Vx_DT, LD_Vx_I, LD_Vx_Vy, LD_Vx_byte, NULL, decTo;

require('./polyfill.js');

decTo = require('./decTo');

Cpu = function(display) {
  var ram;
  ram = new ArrayBuffer(0xFFF);
  this.ram = new Uint8Array(ram);
  this.v = new Uint8Array(16);
  this.i = 0;
  this.dt = 0;
  this.st = 0;
  this.pc = 0x200;
  this.stack = new Uint16Array(16);
  this.sp = 0;
  this.display = display;
  this.screen = new Array(64 * 32);
  this.hexChars = [0xF0, 0x90, 0x90, 0x90, 0xF0, 0x20, 0x60, 0x20, 0x20, 0x70, 0xF0, 0x10, 0xF0, 0x80, 0xF0, 0xF0, 0x10, 0xF0, 0x10, 0xF0, 0x90, 0x90, 0xF0, 0x10, 0x10, 0xF0, 0x80, 0xF0, 0x10, 0xF0, 0xF0, 0x80, 0xF0, 0x90, 0xF0, 0xF0, 0x10, 0x20, 0x40, 0x40, 0xF0, 0x90, 0xF0, 0x90, 0xF0, 0xF0, 0x90, 0xF0, 0x10, 0xF0, 0xF0, 0x90, 0xF0, 0x90, 0x90, 0xE0, 0x90, 0xE0, 0x90, 0xE0, 0xF0, 0x80, 0x80, 0x80, 0xF0, 0xE0, 0x90, 0x90, 0x90, 0xE0, 0xF0, 0x80, 0xF0, 0x80, 0xF0, 0xF0, 0x80, 0xF0, 0x80, 0x80];
  this.init();
};

NULL = function() {
  return console.log("NULL->Instruction: " + (decTo.hex(this.opcode)));
};

CLS_RET = function() {
  var kk;
  kk = this.kk;
  if (kk === 0xE0) {
    console.log("0xE0->Instruction: CLS " + (decTo.hex(this.opcode)));
    this.screen = this.screen.map(function(px) {
      return 0;
    });
    return this.display.clear();
  } else if (kk === 0xEE) {
    console.log("00EE->Instruction: RET " + (decTo.hex(this.opcode)));
    return this.pc = this.stack[--this.sp & 0xF];
  }
};

CALL_addr = function() {
  console.log("2NNN->Instruction: CALL addr " + (decTo.hex(this.opcode)));
  this.stack[this.sp++ & 0xF] = this.pc;
  return this.pc = this.nnn;
};

LD_Vx_byte = function() {
  console.log("6XKK->Instruction: LD Vx, byte " + (decTo.hex(this.opcode)));
  return this.v[this.x] = this.kk;
};

ADD_Vx_byte = function() {
  console.log("7XKK->Instruction: ADD Vx, byte " + (decTo.hex(this.opcode)));
  return this.v[this.x] += this.kk;
};

LD_Vx_Vy = function() {
  console.log("8XY0->Instruction: LD Vx, Vy " + (decTo.hex(this.opcode)));
  return this.v[this.x] = this.v[this.y];
};

ARITHMETIC = function() {
  return this.arithmetic[this.n].call(this);
};

LD_I_addr = function() {
  console.log("ANNN->Instruction: LD I, addr " + (decTo.hex(this.opcode)));
  return this.i = this.nnn;
};

DRW_Vx_Vy_nibble = function() {
  var address, i, index, j, k, n, pos, px, ram, ref, sprite, sx, sy, v, x, y;
  console.log("DXYN->Instruction: DRW Vx, Vy, nibble " + (decTo.hex(this.opcode)));
  v = this.v, x = this.x, y = this.y, n = this.n, i = this.i, ram = this.ram;
  this.v[0xF] = 0;
  for (address = j = 0, ref = n - 1; 0 <= ref ? j <= ref : j >= ref; address = 0 <= ref ? ++j : --j) {
    sprite = ram[address + i];
    for (index = k = 0; k <= 7; index = ++k) {
      sx = (v[x] + index) & 63;
      sy = (v[y] + address) & 31;
      pos = 64 * sy + sx;
      px = (sprite & (1 << (7 - index))) !== 0;
      this.v[0xF] |= this.screen[pos] & px;
      this.screen[pos] ^= px;
    }
  }
  return this.display.render(this.screen);
};

CPU_Extra = function() {
  return this.extra[this.y].call(this);
};

LD_Vx_DT = function() {
  console.log("FX07->Instruction: LD Vx, DT " + (decTo.hex(this.opcode)));
  return this.v[this.x] = this.dt;
};

FX15_18_1E = function() {
  var kk;
  kk = this.kk;
  if (kk === 0x15) {
    console.log("FX15->Instruction: LD DT, Vx " + (decTo.hex(this.opcode)));
    return this.dt = this.v[this.x];
  } else if (kk === 0x18) {
    return console.log("FAIL->Instruction: LD ST, Vx " + (decTo.hex(this.opcode)));
  } else if (kk === 0x1E) {
    return console.log("FAIL->Instruction: ADD I, Vx " + (decTo.hex(this.opcode)));
  }
};

LD_F_Vx = function() {
  console.log("FX29->Instruction: LD F, Vx " + (decTo.hex(this.opcode)));
  return this.i = this.v[this.x] * 5;
};

LD_B_Vx = function() {
  console.log("FX33->Instruction: LD B, Vx " + (decTo.hex(this.opcode)));
  this.ram[this.i] = this.v[this.x] / 100;
  this.ram[this.i + 1] = (this.v[this.x] / 10) % 10;
  return this.ram[this.i + 2] = this.v[this.x] % 10;
};

LD_Vx_I = function() {
  var address, j, ref, results;
  console.log("FX65->Instruction: LD Vx, [I] " + (decTo.hex(this.opcode)));
  results = [];
  for (address = j = 0, ref = this.x; 0 <= ref ? j <= ref : j >= ref; address = 0 <= ref ? ++j : --j) {
    results.push(this.v[address] = this.ram[this.i + address]);
  }
  return results;
};

Cpu.prototype = {
  init: function() {
    var address, byte, j, len, ref, results;
    this.ram = this.ram.map(function(byte) {
      return 0;
    });
    this.screen = this.screen.map(function(px) {
      return 0;
    });
    this.v = this.v.map(function(byte) {
      return 0;
    });
    this.stack = this.stack.map(function(_2bytes) {
      return 0;
    });
    this.i = this.dt = this.st = this.sp = 0;
    this.pc = 0x200;
    ref = this.hexChars;
    results = [];
    for (address = j = 0, len = ref.length; j < len; address = ++j) {
      byte = ref[address];
      results.push(this.ram[address] = byte);
    }
    return results;
  },
  table: [CLS_RET, NULL, CALL_addr, NULL, NULL, NULL, LD_Vx_byte, ADD_Vx_byte, ARITHMETIC, NULL, LD_I_addr, NULL, NULL, DRW_Vx_Vy_nibble, NULL, CPU_Extra],
  extra: [NULL, FX15_18_1E, LD_F_Vx, LD_B_Vx, NULL, NULL, LD_Vx_I, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL],
  arithmetic: [LD_Vx_Vy, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL],
  load: function(rom) {
    var address, byte, j, len, results;
    results = [];
    for (address = j = 0, len = rom.length; j < len; address = ++j) {
      byte = rom[address];
      results.push(this.ram[address + 0x200] = byte);
    }
    return results;
  },
  fetch: function() {
    var pc, ram;
    ram = this.ram, pc = this.pc;
    this.opcode = (ram[pc] << 8) + ram[pc + 1];
    return this.pc += 2;
  },
  execute: function() {
    var address;
    this.fetch();
    address = (this.opcode & 0xF000) >> 12;
    this.nnn = this.opcode & 0x0FFF;
    this.kk = this.nnn & 0x0FF;
    this.n = this.kk & 0x0F;
    this.x = (this.nnn & 0xF00) >> 8;
    this.y = (this.nnn & 0x0F0) >> 4;
    this.table[address].call(this);
    if (this.dt) {
      this.dt = this.dt - 1;
    }
    if (this.st) {
      if (--this.st === 0) {
        return console.info('beep');
      }
    }
  }
};

module.exports = Cpu;


},{"./decTo":4,"./polyfill.js":12}],4:[function(require,module,exports){
module.exports = {
  bin: function(dec, base) {
    if (base == null) {
      base = 2;
    }
    return dec.toString(base);
  },
  oct: function(dec, base) {
    if (base == null) {
      base = 8;
    }
    return dec.toString(base);
  },
  hex: function(dec, base) {
    if (base == null) {
      base = 16;
    }
    return dec.toString(base).toUpperCase();
  }
};


},{}],5:[function(require,module,exports){
var Display;

Display = function(width, height, exp) {
  if (exp == null) {
    exp = 1;
  }
  this.element = document.createElement('canvas');
  this.element.width = width * exp;
  this.element.height = height * exp;
  this.ctx = this.element.getContext('2d');
  this.width = width;
  this.height = height;
  this.exp = exp;
  this.ctx.fillStyle = '#FFF';
  this.ctx.fillRect(0, 0, this.element.width, this.element.height);
};

Display.prototype = {
  clear: function() {
    return this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
  render: function(screen) {
    var ctx, exp, i, index, len, px, results, width, x, y;
    ctx = this.ctx, width = this.width, exp = this.exp;
    results = [];
    for (index = i = 0, len = screen.length; i < len; index = ++i) {
      px = screen[index];
      x = (index % width) * exp;
      y = ((index / width) | 0) * exp;
      if (px === 1) {
        ctx.fillStyle = '#000';
      } else {
        ctx.fillStyle = '#FFF';
      }
      results.push(ctx.fillRect(x, y, exp, exp));
    }
    return results;
  }
};

module.exports = Display;


},{}],6:[function(require,module,exports){

},{}],7:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":8}],8:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],9:[function(require,module,exports){
(function (process){
module.exports = !!(typeof process != 'undefined' && process.versions && process.versions.node);

}).call(this,require('_process'))
},{"_process":8}],10:[function(require,module,exports){
/**
 * Export `findpath` function to get the platform dependant path of the `nodewebkit` binary
 */
module.exports.findpath = require('./lib/findpath.js');
},{"./lib/findpath.js":11}],11:[function(require,module,exports){
(function (process,__dirname){
var fs = require('fs');
var path = require('path');
var bindir = path.resolve(__dirname, '..', 'nwjs');

module.exports = function() {
  var bin = bindir;
  if (process.platform === 'darwin') {
    if (fs.existsSync(path.join(bin, 'Contents'))) {
      bin = path.join(bin, 'Contents', 'MacOS', 'nwjs');
    } else {
      bin = path.join(bin, 'nwjs.app', 'Contents', 'MacOS', 'nwjs');
    }
  } else if (process.platform === 'win32') {
    bin = path.join(bin, 'nw.exe');
  } else {
    bin = path.join(bin, 'nw');
  }
  return bin;
}

}).call(this,require('_process'),"/node_modules/nw/lib")
},{"_process":8,"fs":6,"path":7}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
var Rom;

Rom = function(dropZone) {
  this.dropZone = dropZone;
};

Rom.prototype = {
  read: function(callback) {
    this.handleFileSelect = function(event) {
      var file, reader;
      event.stopPropagation();
      event.preventDefault();
      file = event.dataTransfer.files[0];
      reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = function(event) {
        return callback(null, new Uint8Array(this.result));
      };
      return reader.onerror = function(event) {
        return callback(event);
      };
    };
    this.handleDragOver = function(event) {
      event.stopPropagation();
      event.preventDefault();
      return event.dataTransfer.dropEffect = 'copy';
    };
    this.dropZone.addEventListener('dragover', this.handleDragOver, false);
    return this.dropZone.addEventListener('drop', this.handleFileSelect, false);
  }
};

module.exports = Rom;


},{}]},{},[1]);
