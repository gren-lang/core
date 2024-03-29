/*

import Bytes.Encode as Encode exposing (getWidth, write)
import Gren.Kernel.Scheduler exposing (binding, succeed)
import Gren.Kernel.Utils exposing (chr)
import Maybe exposing (Just, Nothing)

*/

// BYTES

function _Bytes_width(bytes) {
  return bytes.byteLength;
}

var _Bytes_getHostEndianness = F2(function (le, be) {
  return __Scheduler_binding(function (callback) {
    callback(
      __Scheduler_succeed(
        new Uint8Array(new Uint32Array([1]))[0] === 1 ? le : be
      )
    );
  });
});

// ENCODERS

function _Bytes_encode(encoder) {
  var mutableBytes = new DataView(new ArrayBuffer(__Encode_getWidth(encoder)));
  __Encode_write(encoder)(mutableBytes)(0);
  return mutableBytes;
}

// SIGNED INTEGERS

var _Bytes_write_i8 = F3(function (mb, i, n) {
  mb.setInt8(i, n);
  return i + 1;
});
var _Bytes_write_i16 = F4(function (mb, i, n, isLE) {
  mb.setInt16(i, n, isLE);
  return i + 2;
});
var _Bytes_write_i32 = F4(function (mb, i, n, isLE) {
  mb.setInt32(i, n, isLE);
  return i + 4;
});

// UNSIGNED INTEGERS

var _Bytes_write_u8 = F3(function (mb, i, n) {
  mb.setUint8(i, n);
  return i + 1;
});
var _Bytes_write_u16 = F4(function (mb, i, n, isLE) {
  mb.setUint16(i, n, isLE);
  return i + 2;
});
var _Bytes_write_u32 = F4(function (mb, i, n, isLE) {
  mb.setUint32(i, n, isLE);
  return i + 4;
});

// FLOATS

var _Bytes_write_f32 = F4(function (mb, i, n, isLE) {
  mb.setFloat32(i, n, isLE);
  return i + 4;
});
var _Bytes_write_f64 = F4(function (mb, i, n, isLE) {
  mb.setFloat64(i, n, isLE);
  return i + 8;
});

// BYTES

var _Bytes_write_bytes = F3(function (mb, offset, bytes) {
  for (var i = 0, len = bytes.byteLength, limit = len - 4; i <= limit; i += 4) {
    mb.setUint32(offset + i, bytes.getUint32(i));
  }
  for (; i < len; i++) {
    mb.setUint8(offset + i, bytes.getUint8(i));
  }
  return offset + len;
});

// STRINGS

function _Bytes_getStringWidth(string) {
  for (var width = 0, i = 0; i < string.length; i++) {
    var code = string.charCodeAt(i);
    width +=
      code < 0x80
        ? 1
        : code < 0x800
        ? 2
        : code < 0xd800 || 0xdbff < code
        ? 3
        : (i++, 4);
  }
  return width;
}

var _Bytes_write_string = F3(function (mb, offset, string) {
  for (var i = 0; i < string.length; i++) {
    var code = string.charCodeAt(i);
    offset +=
      code < 0x80
        ? (mb.setUint8(offset, code), 1)
        : code < 0x800
        ? (mb.setUint16(
            offset,
            0xc080 /* 0b1100000010000000 */ |
              (((code >>> 6) & 0x1f) /* 0b00011111 */ << 8) |
              (code & 0x3f) /* 0b00111111 */
          ),
          2)
        : code < 0xd800 || 0xdbff < code
        ? (mb.setUint16(
            offset,
            0xe080 /* 0b1110000010000000 */ |
              (((code >>> 12) & 0xf) /* 0b00001111 */ << 8) |
              ((code >>> 6) & 0x3f) /* 0b00111111 */
          ),
          mb.setUint8(
            offset + 2,
            0x80 /* 0b10000000 */ | (code & 0x3f) /* 0b00111111 */
          ),
          3)
        : ((code =
            (code - 0xd800) * 0x400 +
            string.charCodeAt(++i) -
            0xdc00 +
            0x10000),
          mb.setUint32(
            offset,
            0xf0808080 /* 0b11110000100000001000000010000000 */ |
              (((code >>> 18) & 0x7) /* 0b00000111 */ << 24) |
              (((code >>> 12) & 0x3f) /* 0b00111111 */ << 16) |
              (((code >>> 6) & 0x3f) /* 0b00111111 */ << 8) |
              (code & 0x3f) /* 0b00111111 */
          ),
          4);
  }
  return offset;
});

// DECODER

var _Bytes_decode = F2(function (decoder, bytes) {
  try {
    return __Maybe_Just(A2(decoder, bytes, 0).__$value);
  } catch (e) {
    return __Maybe_Nothing;
  }
});

var _Bytes_read_i8 = F2(function (bytes, offset) {
  return { __$offset: offset + 1, __$value: bytes.getInt8(offset) };
});
var _Bytes_read_i16 = F3(function (isLE, bytes, offset) {
  return { __$offset: offset + 2, __$value: bytes.getInt16(offset, isLE) };
});
var _Bytes_read_i32 = F3(function (isLE, bytes, offset) {
  return { __$offset: offset + 4, __$value: bytes.getInt32(offset, isLE) };
});
var _Bytes_read_u8 = F2(function (bytes, offset) {
  return { __$offset: offset + 1, __$value: bytes.getUint8(offset) };
});
var _Bytes_read_u16 = F3(function (isLE, bytes, offset) {
  return { __$offset: offset + 2, __$value: bytes.getUint16(offset, isLE) };
});
var _Bytes_read_u32 = F3(function (isLE, bytes, offset) {
  return { __$offset: offset + 4, __$value: bytes.getUint32(offset, isLE) };
});
var _Bytes_read_f32 = F3(function (isLE, bytes, offset) {
  return { __$offset: offset + 4, __$value: bytes.getFloat32(offset, isLE) };
});
var _Bytes_read_f64 = F3(function (isLE, bytes, offset) {
  return { __$offset: offset + 8, __$value: bytes.getFloat64(offset, isLE) };
});

var _Bytes_read_bytes = F3(function (len, bytes, offset) {
  return {
    __$offset: offset + len,
    __$value: new DataView(bytes.buffer, bytes.byteOffset + offset, len),
  };
});

var _Bytes_read_string = F3(function (len, bytes, offset) {
  var string = "";
  var end = offset + len;
  for (; offset < end; ) {
    var byte = bytes.getUint8(offset++);
    string +=
      byte < 128
        ? String.fromCharCode(byte)
        : (byte & 0xe0) /* 0b11100000 */ === 0xc0 /* 0b11000000 */
        ? String.fromCharCode(
            ((byte & 0x1f) /* 0b00011111 */ << 6) |
              (bytes.getUint8(offset++) & 0x3f) /* 0b00111111 */
          )
        : (byte & 0xf0) /* 0b11110000 */ === 0xe0 /* 0b11100000 */
        ? String.fromCharCode(
            ((byte & 0xf) /* 0b00001111 */ << 12) |
              ((bytes.getUint8(offset++) & 0x3f) /* 0b00111111 */ << 6) |
              (bytes.getUint8(offset++) & 0x3f) /* 0b00111111 */
          )
        : ((byte =
            (((byte & 0x7) /* 0b00000111 */ << 18) |
              ((bytes.getUint8(offset++) & 0x3f) /* 0b00111111 */ << 12) |
              ((bytes.getUint8(offset++) & 0x3f) /* 0b00111111 */ << 6) |
              (bytes.getUint8(offset++) & 0x3f)) /* 0b00111111 */ -
            0x10000),
          String.fromCharCode(
            Math.floor(byte / 0x400) + 0xd800,
            (byte % 0x400) + 0xdc00
          ));
  }
  return { __$offset: offset, __$value: string };
});

var _Bytes_decodeFailure = F2(function () {
  throw 0;
});
