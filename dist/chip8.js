(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
var Clock, Cpu, Display, Rom, args, clock, cpu, display, isNode, rom;

args = require('minimist')(process.argv.slice(2));

isNode = require('is-node');

Cpu = require('./cpu');

Display = require('./display');

Rom = require('./rom');

Clock = require('./clock');

cpu = new Cpu();

display = new Display(64, 32, 10);

rom = new Rom(display.element);

clock = new Clock();

if (isNode) {
  if (!args.file) {
    console.log('require --file ROM');
  } else {
    rom.read(args.file, function(err, data) {
      cpu.load(data);
      clock.cycle(function() {
        cpu.execute();
        return display.render(cpu.screen);
      });
      return clock.start();
    });
  }
} else {
  document.body.appendChild(display.element);
  rom.read(function(err, data) {
    cpu.load(data);
    window.cpu = cpu;
    clock.cycle(function() {
      cpu.execute();
      return display.render(cpu.screen);
    });
    return clock.start();
  });
}


}).call(this,require('_process'))
},{"./clock":2,"./cpu":3,"./display":5,"./rom":10,"_process":7,"is-node":8,"minimist":9}],2:[function(require,module,exports){
var Clock;

Clock = function() {};

Clock.prototype = {
  cycle: function(cycle) {
    return this.cycle = cycle;
  },
  getRequestAnimationFrame: function() {
    return requestAnimationFrame || webkitRequestAnimationFrame || mozRequestAnimationFrame || oRequestAnimationFrame || msRequestAnimationFrame;
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
var ADD_Vx_byte, ARITHMETIC, CALL_addr, CLS_RET, CPU_Extra, Cpu, DRW_Vx_Vy_nibble, LD_B_Vx, LD_F_Vx, LD_I_addr, LD_Vx_I, LD_Vx_Vy, LD_Vx_byte, NULL, decTo;

decTo = require('./decTo');

Cpu = function() {
  var ram;
  ram = new ArrayBuffer(0xFFF);
  this.ram = new Uint8Array(ram);
  this.v = new Uint8Array(16);
  this.i = 0;
  this.delay = 0;
  this.timer = 0;
  this.pc = 0x200;
  this.stack = new Uint16Array(16);
  this.sp = 0;
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
    console.log("0xE0->Instruction: " + (decTo.hex(this.opcode)));
    return this.screen = this.screen.map(function(px) {
      return 0;
    });
  } else if (kk === 0xEE) {
    console.log("00EE->Instruction: " + (decTo.hex(this.opcode)));
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
  console.groupCollapsed('DRW');
  for (address = j = 0, ref = n - 1; 0 <= ref ? j <= ref : j >= ref; address = 0 <= ref ? ++j : --j) {
    sprite = ram[address + i];
    console.log(decTo.bin(sprite));
    for (index = k = 0; k <= 7; index = ++k) {
      sx = (v[x] + index) & 63;
      sy = (v[y] + address) & 31;
      pos = 64 * sy + sx;
      px = (sprite & (1 << (7 - index))) !== 0;
      this.v[0xF] |= this.screen[pos] & px;
      this.screen[pos] ^= px;
    }
  }
  return console.groupEnd();
};

CPU_Extra = function() {
  return this.extra[this.y].call(this);
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
    this.i = this.delay = this.timer = this.sp = 0;
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
  extra: [NULL, NULL, LD_F_Vx, LD_B_Vx, NULL, NULL, LD_Vx_I, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL],
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
    return this.table[address].call(this);
  }
};

module.exports = Cpu;


},{"./decTo":4}],4:[function(require,module,exports){
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
var Canvas, Display, isNode;

isNode = require('is-node');

Canvas = require('canvas');

Display = function(width, height, exp) {
  if (exp == null) {
    exp = 1;
  }
  if (!isNode) {
    this.element = document.createElement('canvas');
    this.element.width = width * exp;
    this.element.height = height * exp;
  } else {
    this.element = new Canvas(width * exp, height * exp);
  }
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


},{"canvas":6,"is-node":8}],6:[function(require,module,exports){

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
(function (process){
module.exports = !!(typeof process != 'undefined' && process.versions && process.versions.node);

}).call(this,require('_process'))
},{"_process":7}],9:[function(require,module,exports){
module.exports = function (args, opts) {
    if (!opts) opts = {};
    
    var flags = { bools : {}, strings : {}, unknownFn: null };

    if (typeof opts['unknown'] === 'function') {
        flags.unknownFn = opts['unknown'];
    }

    if (typeof opts['boolean'] === 'boolean' && opts['boolean']) {
      flags.allBools = true;
    } else {
      [].concat(opts['boolean']).filter(Boolean).forEach(function (key) {
          flags.bools[key] = true;
      });
    }
    
    var aliases = {};
    Object.keys(opts.alias || {}).forEach(function (key) {
        aliases[key] = [].concat(opts.alias[key]);
        aliases[key].forEach(function (x) {
            aliases[x] = [key].concat(aliases[key].filter(function (y) {
                return x !== y;
            }));
        });
    });

    [].concat(opts.string).filter(Boolean).forEach(function (key) {
        flags.strings[key] = true;
        if (aliases[key]) {
            flags.strings[aliases[key]] = true;
        }
     });

    var defaults = opts['default'] || {};
    
    var argv = { _ : [] };
    Object.keys(flags.bools).forEach(function (key) {
        setArg(key, defaults[key] === undefined ? false : defaults[key]);
    });
    
    var notFlags = [];

    if (args.indexOf('--') !== -1) {
        notFlags = args.slice(args.indexOf('--')+1);
        args = args.slice(0, args.indexOf('--'));
    }

    function argDefined(key, arg) {
        return (flags.allBools && /^--[^=]+$/.test(arg)) ||
            flags.strings[key] || flags.bools[key] || aliases[key];
    }

    function setArg (key, val, arg) {
        if (arg && flags.unknownFn && !argDefined(key, arg)) {
            if (flags.unknownFn(arg) === false) return;
        }

        var value = !flags.strings[key] && isNumber(val)
            ? Number(val) : val
        ;
        setKey(argv, key.split('.'), value);
        
        (aliases[key] || []).forEach(function (x) {
            setKey(argv, x.split('.'), value);
        });
    }

    function setKey (obj, keys, value) {
        var o = obj;
        keys.slice(0,-1).forEach(function (key) {
            if (o[key] === undefined) o[key] = {};
            o = o[key];
        });

        var key = keys[keys.length - 1];
        if (o[key] === undefined || flags.bools[key] || typeof o[key] === 'boolean') {
            o[key] = value;
        }
        else if (Array.isArray(o[key])) {
            o[key].push(value);
        }
        else {
            o[key] = [ o[key], value ];
        }
    }
    
    function aliasIsBoolean(key) {
      return aliases[key].some(function (x) {
          return flags.bools[x];
      });
    }

    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        
        if (/^--.+=/.test(arg)) {
            // Using [\s\S] instead of . because js doesn't support the
            // 'dotall' regex modifier. See:
            // http://stackoverflow.com/a/1068308/13216
            var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
            var key = m[1];
            var value = m[2];
            if (flags.bools[key]) {
                value = value !== 'false';
            }
            setArg(key, value, arg);
        }
        else if (/^--no-.+/.test(arg)) {
            var key = arg.match(/^--no-(.+)/)[1];
            setArg(key, false, arg);
        }
        else if (/^--.+/.test(arg)) {
            var key = arg.match(/^--(.+)/)[1];
            var next = args[i + 1];
            if (next !== undefined && !/^-/.test(next)
            && !flags.bools[key]
            && !flags.allBools
            && (aliases[key] ? !aliasIsBoolean(key) : true)) {
                setArg(key, next, arg);
                i++;
            }
            else if (/^(true|false)$/.test(next)) {
                setArg(key, next === 'true', arg);
                i++;
            }
            else {
                setArg(key, flags.strings[key] ? '' : true, arg);
            }
        }
        else if (/^-[^-]+/.test(arg)) {
            var letters = arg.slice(1,-1).split('');
            
            var broken = false;
            for (var j = 0; j < letters.length; j++) {
                var next = arg.slice(j+2);
                
                if (next === '-') {
                    setArg(letters[j], next, arg)
                    continue;
                }
                
                if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
                    setArg(letters[j], next.split('=')[1], arg);
                    broken = true;
                    break;
                }
                
                if (/[A-Za-z]/.test(letters[j])
                && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
                    setArg(letters[j], next, arg);
                    broken = true;
                    break;
                }
                
                if (letters[j+1] && letters[j+1].match(/\W/)) {
                    setArg(letters[j], arg.slice(j+2), arg);
                    broken = true;
                    break;
                }
                else {
                    setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg);
                }
            }
            
            var key = arg.slice(-1)[0];
            if (!broken && key !== '-') {
                if (args[i+1] && !/^(-|--)[^-]/.test(args[i+1])
                && !flags.bools[key]
                && (aliases[key] ? !aliasIsBoolean(key) : true)) {
                    setArg(key, args[i+1], arg);
                    i++;
                }
                else if (args[i+1] && /true|false/.test(args[i+1])) {
                    setArg(key, args[i+1] === 'true', arg);
                    i++;
                }
                else {
                    setArg(key, flags.strings[key] ? '' : true, arg);
                }
            }
        }
        else {
            if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
                argv._.push(
                    flags.strings['_'] || !isNumber(arg) ? arg : Number(arg)
                );
            }
            if (opts.stopEarly) {
                argv._.push.apply(argv._, args.slice(i + 1));
                break;
            }
        }
    }
    
    Object.keys(defaults).forEach(function (key) {
        if (!hasKey(argv, key.split('.'))) {
            setKey(argv, key.split('.'), defaults[key]);
            
            (aliases[key] || []).forEach(function (x) {
                setKey(argv, x.split('.'), defaults[key]);
            });
        }
    });
    
    if (opts['--']) {
        argv['--'] = new Array();
        notFlags.forEach(function(key) {
            argv['--'].push(key);
        });
    }
    else {
        notFlags.forEach(function(key) {
            argv._.push(key);
        });
    }

    return argv;
};

function hasKey (obj, keys) {
    var o = obj;
    keys.slice(0,-1).forEach(function (key) {
        o = (o[key] || {});
    });

    var key = keys[keys.length - 1];
    return key in o;
}

function isNumber (x) {
    if (typeof x === 'number') return true;
    if (/^0x[0-9a-f]+$/i.test(x)) return true;
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}


},{}],10:[function(require,module,exports){
var Rom, isNode, readFile;

isNode = require('is-node');

readFile = require('fs').readFile;

Rom = function(dropZone) {
  if (!isNode) {
    this.dropZone = dropZone;
  }
};

Rom.prototype = {
  read: function(src, callback) {
    if (arguments.length === 1 && !isNode) {
      callback = src;
    }
    if (isNode) {
      return readFile(src, function(err, data) {
        if (err) {
          return callback(err);
        } else {
          return callback(null, data);
        }
      });
    } else {
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
  }
};

module.exports = Rom;


},{"fs":6,"is-node":8}]},{},[1]);
