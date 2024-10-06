/*

import Bytes.Encode as Encode exposing (getLength, write)
import Gren.Kernel.Scheduler exposing (binding, succeed)
import Gren.Kernel.Utils exposing (chr)
import Maybe exposing (Just, Nothing)

*/

// BYTES

var _Bytes_empty = new DataView(new ArrayBuffer(0));

function _Bytes_length(bytes) {
  return bytes.byteLength;
}

var _Bytes_getHostEndianness = F2(function (le, be) {
  return __Scheduler_binding(function (callback) {
    callback(
      __Scheduler_succeed(
        new Uint8Array(new Uint32Array([1]))[0] === 1 ? le : be,
      ),
    );
  });
});

function _Bytes_fromString(str) {
  var encoder = new TextEncoder();
  var uint8s = encoder.encode(str);
  return new DataView(uint8s.buffer);
}

function _Bytes_toString(bytes) {
  var decoder = new TextDecoder("utf-8", { fatal: true });

  try {
    return __Maybe_Just(decoder.decode(bytes));
  } catch (e) {
    return __Maybe_Nothing;
  }
}

function _Bytes_join(arrayOfBytes) {
  var requiredSize = 0;
  for (var i = 0; i < arrayOfBytes.length; i++) {
    requiredSize += arrayOfBytes[i].byteLength;
  }

  var offset = 0;
  var result = new Uint8Array(requiredSize);

  for (var i = 0; i < arrayOfBytes.length; i++) {
    var currentBytes = new Uint8Array(arrayOfBytes[i].buffer);
    var currentByteLength = arrayOfBytes[i].byteLength;

    for (var j = 0; j < currentByteLength; j++) {
      result[offset] = currentBytes[j];
      offset++;
    }
  }

  return new DataView(result.buffer);
}

// ENCODERS

function _Bytes_encode(encoder) {
  var mutableBytes = new DataView(new ArrayBuffer(__Encode_getLength(encoder)));
  A3(__Encode_write, encoder, mutableBytes, 0);
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

// DECODER

var _Bytes_decode = F2(function (decoder, bytes) {
  try {
    return __Maybe_Just(A2(decoder, bytes, 0).__$value);
  } catch (e) {
    if (e instanceof RangeError) {
      return __Maybe_Nothing;
    } else {
      throw e;
    }
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

var _Bytes_decodeFailure = F2(function () {
  throw 0;
});
