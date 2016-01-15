(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
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
},{"_process":3}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
(function (process){
module.exports = !!(typeof process != 'undefined' && process.versions && process.versions.node);

}).call(this,require('_process'))
},{"_process":3}],5:[function(require,module,exports){
/**
 * Export `findpath` function to get the platform dependant path of the `nodewebkit` binary
 */
module.exports.findpath = require('./lib/findpath.js');
},{"./lib/findpath.js":6}],6:[function(require,module,exports){
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

}).call(this,require('_process'),"/../node_modules/nw/lib")
},{"_process":3,"fs":1,"path":2}],7:[function(require,module,exports){
var Clock, Cpu, Display, Rom, clock, cpu, display, gui, isNode, rom;

isNode = require('is-node');

gui = require('nw').gui;

Cpu = require('./cpu');

Display = require('./display');

Rom = require('./rom');

Clock = require('./clock');

display = new Display('canvas', 64, 32, 6, 'renderPixel32bit');

cpu = new Cpu(display);

rom = new Rom(display.element);

clock = new Clock();

if (isNode) {
  gui.Window.get().show();
}

rom.read(function(err, data) {
  window.cpu = cpu;
  cpu.init();
  cpu.load(data);
  clock.cycle(60, function() {
    return cpu.execute();
  });
  return clock.start();
});


},{"./clock":8,"./cpu":9,"./display":11,"./rom":13,"is-node":4,"nw":5}],8:[function(require,module,exports){
var Clock;

Clock = function() {};

Clock.prototype = {
  cycle: function(hz, cycle) {
    this.hz = hz;
    this.cycle = cycle;
    if (hz > 60) {
      return this.getRequestAnimationFrame = function(interval) {
        return function(callback) {
          return setTimeout(callback, interval);
        };
      };
    }
  },
  getRequestAnimationFrame: function(interval) {
    return requestAnimationFrame || webkitRequestAnimationFrame || mozRequestAnimationFrame || oRequestAnimationFrame || msRequestAnimationFrame || function(callback) {
      return setTimeout(callback, interval);
    };
  },
  start: function() {
    var _loop, animationFrame, delta, element, fps, frame, interval, now, progress, self, start;
    element = document.getElementById('fps');
    interval = 1000 / this.hz;
    animationFrame = this.getRequestAnimationFrame(interval);
    self = this;
    start = progress = now = delta = frame = fps = 0;
    _loop = function(timestamp) {
      timestamp = timestamp ? timestamp : Date.now();
      if (!progress) {
        start = progress = timestamp;
      }
      now = timestamp;
      delta = now - progress | 0;
      if (delta > interval) {
        progress = now - (delta % interval);
        fps = (++frame / ((progress - start) / 1000)) | 0;
        element.innerHTML = "fps: " + fps;
        self.cycle();
      }
      return animationFrame(_loop);
    };
    return animationFrame(_loop);
  }
};

module.exports = Clock;


},{}],9:[function(require,module,exports){
var ADD_Vx_byte, AND_Vx_Vy, ARITHMETIC, CALL_addr, CLS_RET, CPU_Extra, Cpu, DRW_Vx_Vy_nibble, FX07_0A, FX15_18_1E, JP_addr, LD_B_Vx, LD_F_Vx, LD_I_addr, LD_Vx_I, LD_Vx_Vy, LD_Vx_byte, NULL, OR_Vx_Vy, RND_Vx_byte, SE_Vx_Vy, SE_Vx_byte, SNE_Vx_byte, decTo;

require('./polyfill');

decTo = require('./decTo');

Cpu = function(display) {
  this.ram = new Uint8Array(0xFFF);
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

CLS_RET = function(x, y, kk, n, nnn) {
  var display, screen;
  screen = this.screen, display = this.display;
  if (kk === 0xE0) {
    console.log("0xE0->Instruction: CLS " + (decTo.hex(this.opcode)));
    screen = screen.map(function(px) {
      return 0;
    });
    return display.clear();
  } else if (kk === 0xEE) {
    console.log("00EE->Instruction: RET " + (decTo.hex(this.opcode)));
    return this.pc = this.stack[--this.sp & 0xF];
  }
};

JP_addr = function(x, y, kk, n, nnn) {
  console.log("1NNN->Instruction: JP addr " + (decTo.hex(this.opcode)));
  return this.pc = nnn;
};

CALL_addr = function(x, y, kk, n, nnn) {
  console.log("2NNN->Instruction: CALL addr " + (decTo.hex(this.opcode)));
  this.stack[this.sp++ & 0xF] = this.pc;
  return this.pc = nnn;
};

SE_Vx_byte = function(x, y, kk, n, nnn) {
  console.log("3xkk->Instruction: SE Vx, byte " + (decTo.hex(this.opcode)));
  if (this.v[x] === kk) {
    return this.pc += 2;
  }
};

SNE_Vx_byte = function(x, y, kk, n, nnn) {
  console.log("4xkk->Instruction: SNE Vx, byte " + (decTo.hex(this.opcode)));
  if (this.v[x] !== kk) {
    return this.pc += 2;
  }
};

SE_Vx_Vy = function(x, y, kk, n, nnn) {
  console.log("5xk0->Instruction: SE Vx, Vy " + (decTo.hex(this.opcode)));
  if (this.v[x] === this.v[y]) {
    return this.pc += 2;
  }
};

LD_Vx_byte = function(x, y, kk, n, nnn) {
  console.log("6XKK->Instruction: LD Vx, byte " + (decTo.hex(this.opcode)));
  return this.v[x] = kk;
};

ADD_Vx_byte = function(x, y, kk, n, nnn) {
  console.log("7XKK->Instruction: ADD Vx, byte " + (decTo.hex(this.opcode)));
  return this.v[x] += kk;
};

LD_Vx_Vy = function(x, y, kk, n, nnn) {
  console.log("8XY0->Instruction: LD Vx, Vy " + (decTo.hex(this.opcode)));
  return this.v[x] = this.v[y];
};

OR_Vx_Vy = function(x, y, kk, n, nnn) {
  console.log("8XY1->Instruction: OR Vx, Vy " + (decTo.hex(this.opcode)));
  return this.v[x] |= this.v[y];
};

AND_Vx_Vy = function(x, y, kk, n, nnn) {
  console.log("8XY2->Instruction: AND Vx, Vy " + (decTo.hex(this.opcode)));
  return this.v[x] &= this.v[y];
};

ARITHMETIC = function(x, y, kk, n, nnn) {
  return this.arithmetic[n].call(this, x, y, kk, n, nnn);
};

LD_I_addr = function(x, y, kk, n, nnn) {
  console.log("ANNN->Instruction: LD I, addr " + (decTo.hex(this.opcode)));
  return this.i = nnn;
};

RND_Vx_byte = function(x, y, kk, n, nnn) {
  console.log("CXKK->Instruction: RND Vx, byte " + (decTo.hex(this.opcode)));
  return this.v[x] = ((Math.random() * 0xFF) | 0) & kk;
};

DRW_Vx_Vy_nibble = function(x, y, kk, n, nnn) {
  var address, display, i, index, j, k, pos, px, ram, ref, screen, sprite, sx, sy, v;
  console.log("DXYN->Instruction: DRW Vx, Vy, nibble " + (decTo.hex(this.opcode)));
  v = this.v, screen = this.screen, display = this.display, i = this.i, ram = this.ram;
  v[0xF] = 0;
  for (address = j = 0, ref = n; j < ref; address = j += 1) {
    sprite = ram[address + i];
    for (index = k = 0; k <= 7; index = ++k) {
      sx = (v[x] + index) & 63;
      sy = (v[y] + address) & 31;
      pos = 64 * sy + sx;
      px = (sprite & (1 << (7 - index))) !== 0;
      v[0xF] |= screen[pos] & px;
      screen[pos] ^= px;
    }
  }
  return display.render(screen);
};

CPU_Extra = function(x, y, kk, n, nnn) {
  return this.extra[y].call(this, x, y, kk, n, nnn);
};

FX07_0A = function(x, y, kk, n, nnn) {
  if (kk === 0x07) {
    console.log("FX07->Instruction: LD Vx, DT " + (decTo.hex(this.opcode)));
    return this.v[x] = this.dt;
  } else if (kk === 0x0A) {
    return console.log("FAIL->Instruction: LD Vx, K " + (decTo.hex(this.opcode)));
  }
};

FX15_18_1E = function(x, y, kk, n, nnn) {
  if (kk === 0x15) {
    console.log("FX15->Instruction: LD DT, Vx " + (decTo.hex(this.opcode)));
    return this.dt = this.v[x];
  } else if (kk === 0x18) {
    return console.log("FAIL->Instruction: LD ST, Vx " + (decTo.hex(this.opcode)));
  } else if (kk === 0x1E) {
    return console.log("FAIL->Instruction: ADD I, Vx " + (decTo.hex(this.opcode)));
  }
};

LD_F_Vx = function(x, y, kk, n, nnn) {
  console.log("FX29->Instruction: LD F, Vx " + (decTo.hex(this.opcode)));
  return this.i = this.v[x] * 5;
};

LD_B_Vx = function(x, y, kk, n, nnn) {
  var i, ram, v;
  console.log("FX33->Instruction: LD B, Vx " + (decTo.hex(this.opcode)));
  ram = this.ram, v = this.v, i = this.i;
  ram[i] = v[x] / 100;
  ram[i + 1] = (v[x] / 10) % 10;
  return ram[i + 2] = v[x] % 10;
};

LD_Vx_I = function(x, y, kk, n, nnn) {
  var address, i, j, ram, ref, results, v;
  console.log("FX65->Instruction: LD Vx, [I] " + (decTo.hex(this.opcode)));
  v = this.v, ram = this.ram, i = this.i;
  results = [];
  for (address = j = 0, ref = x; 0 <= ref ? j <= ref : j >= ref; address = 0 <= ref ? ++j : --j) {
    results.push(v[address] = ram[i + address]);
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
  table: [CLS_RET, JP_addr, CALL_addr, SE_Vx_byte, SNE_Vx_byte, SE_Vx_Vy, LD_Vx_byte, ADD_Vx_byte, ARITHMETIC, NULL, LD_I_addr, NULL, RND_Vx_byte, DRW_Vx_Vy_nibble, NULL, CPU_Extra],
  extra: [FX07_0A, FX15_18_1E, LD_F_Vx, LD_B_Vx, NULL, NULL, LD_Vx_I, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL],
  arithmetic: [LD_Vx_Vy, OR_Vx_Vy, AND_Vx_Vy, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL],
  load: function(rom) {
    var address, byte, j, len, results;
    results = [];
    for (address = j = 0, len = rom.length; j < len; address = ++j) {
      byte = rom[address];
      results.push(this.ram[address + 0x200] = byte);
    }
    return results;
  },
  fetch: function(ram, pc) {
    this.opcode = (ram[pc] << 8) + ram[pc + 1];
    return this.pc += 2;
  },
  execute: function() {
    var address, dt, kk, n, nnn, pc, ram, st, x, y;
    ram = this.ram, pc = this.pc, dt = this.dt, st = this.st;
    this.fetch(ram, pc);
    address = (this.opcode & 0xF000) >> 12;
    nnn = this.opcode & 0x0FFF;
    kk = nnn & 0x0FF;
    n = kk & 0x0F;
    x = (nnn & 0xF00) >> 8;
    y = (nnn & 0x0F0) >> 4;
    this.table[address].call(this, x, y, kk, n, nnn);
    if (dt) {
      this.dt = dt - 1;
    }
    if (st) {
      if (--this.st === 0) {
        return console.info('beep');
      }
    }
  }
};

module.exports = Cpu;


},{"./decTo":10,"./polyfill":12}],10:[function(require,module,exports){
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


},{}],11:[function(require,module,exports){
var Display;

Display = function(id, width, height, exp, methodRender) {
  var buffer;
  if (exp == null) {
    exp = 1;
  }
  if (methodRender == null) {
    methodRender = 'renderPixel32bit';
  }
  this.element = document.getElementById(id);
  this.element.width = width * exp;
  this.element.height = height * exp;
  this.ctx = this.element.getContext('2d');
  this.ctx.fillStyle = '#FFF';
  this.ctx.fillRect(0, 0, width * exp, height * exp);
  this.swidth = width;
  this.sheight = height;
  this.cwidth = width * exp;
  this.cheight = height * exp;
  this.exp = exp;
  this.imgData = this.ctx.getImageData(0, 0, width * exp, height * exp);
  this.data8bit = this.imgData.data;
  buffer = new ArrayBuffer(this.imgData.data.length);
  this.view8bit = new Uint8ClampedArray(buffer);
  this.view32bit = new Uint32Array(buffer);
  this.view32bit[0] = 0x0A0B0C0D;
  this.isLittleEndian = true;
  if (this.view8bit[0] === 0x0A && this.view8bit[1] === 0x0B && this.view8bit[2] === 0x0C && this.view8bit[3] === 0x0D) {
    this.isLittleEndian = false;
  }
  this.render = this[methodRender];
};

Display.prototype = {
  clear: function() {
    return this.ctx.clearRect(0, 0, this.cwidth, this.cheight);
  },
  renderPixel8bit: function(screen) {
    var cheight, ctx, cwidth, data8bit, exp, i, imgData, j, pos, px, ref, ref1, swidth, sx, sy, value, x, y;
    ctx = this.ctx, cheight = this.cheight, cwidth = this.cwidth, swidth = this.swidth, exp = this.exp, data8bit = this.data8bit, imgData = this.imgData;
    for (y = i = 0, ref = cheight; i < ref; y = i += 1) {
      for (x = j = 0, ref1 = cwidth; j < ref1; x = j += 1) {
        pos = (y * cwidth + x) * 4;
        sx = (x / exp) | 0;
        sy = (y / exp) | 0;
        px = screen[sy * swidth + sx];
        if (px) {
          value = 0;
        } else {
          value = 0xFF;
        }
        data8bit[pos] = value;
        data8bit[++pos] = value;
        data8bit[++pos] = value;
        data8bit[++pos] = 0xFF;
      }
    }
    return ctx.putImageData(imgData, 0, 0);
  },
  renderPixel32bit: function(screen) {
    var a, b, cheight, ctx, cwidth, data8bit, exp, g, i, imgData, isLittleEndian, j, pos, px, r, ref, ref1, swidth, sx, sy, value, view32bit, view8bit, x, y;
    ctx = this.ctx, cheight = this.cheight, cwidth = this.cwidth, swidth = this.swidth, exp = this.exp, imgData = this.imgData, data8bit = this.data8bit, view8bit = this.view8bit, view32bit = this.view32bit, isLittleEndian = this.isLittleEndian;
    for (y = i = 0, ref = cheight; i < ref; y = i += 1) {
      for (x = j = 0, ref1 = cwidth; j < ref1; x = j += 1) {
        pos = y * cwidth + x;
        sx = (x / exp) | 0;
        sy = (y / exp) | 0;
        px = screen[sy * swidth + sx];
        if (px) {
          r = g = b = 0;
        } else {
          r = g = b = 0xFF;
        }
        a = 0xFF;
        if (isLittleEndian) {
          value = (a << 24) | (g << 16) | (b << 8) | r;
        } else {
          value = (r << 24) | (b << 16) | (g << 8) | a;
        }
        view32bit[pos] = value;
      }
    }
    data8bit.set(view8bit);
    return ctx.putImageData(imgData, 0, 0);
  },
  renderFillRect: function(screen) {
    var ctx, exp, i, index, len, px, results, swidth, x, y;
    ctx = this.ctx, swidth = this.swidth, exp = this.exp;
    results = [];
    for (index = i = 0, len = screen.length; i < len; index = ++i) {
      px = screen[index];
      x = ((index % swidth) | 0) * exp;
      y = ((index / swidth) | 0) * exp;
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


},{}],12:[function(require,module,exports){
var map,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

map = function(a) {
  var b, d, e;
  b = this;
  d = [];
  e = 0;
  while (e < b) {
    if (indexOf.call(b, e) >= 0) {
      d[e] = call(arguments[1], b[e], e++, b);
    } else {
      d[e] = void 0;
    }
  }
  return d;
};

if ([].map) {
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


},{}]},{},[7]);
