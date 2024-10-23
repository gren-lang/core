/*

import Stream exposing (Locked, Closed)
import Gren.Kernel.Scheduler exposing (binding, succeed, fail, rawSpawn)

*/

var _Stream_read = function (stream) {
  return __Scheduler_binding(function (callback) {
    if (stream.locked) {
      return callback(__Scheduler_fail(__Stream_Locked));
    }

    const reader = stream.getReader();
    reader
      .read()
      .then(({ done, value }) => {
        if (value instanceof Uint8Array) {
          value = new DataView(
            value.buffer,
            value.byteOffset,
            value.byteLength,
          );
        }

        callback(
          __Scheduler_succeed({ __$streamClosed: done, __$value: value }),
        );
      })
      .catch((err) => {
        console.log("ReadableStream err: ", err);
        return callback(__Scheduler_fail(__Stream_Closed));
      })
      .finally(() => {
        reader.releaseLock();
      });
  });
};

var _Stream_write = F2(function (value, stream) {
  return __Scheduler_binding(function (callback) {
    if (stream.locked) {
      return callback(__Scheduler_fail(__Stream_Locked));
    }

    if (value instanceof DataView) {
      value = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }

    const writer = stream.getWriter();
    writer
      .write(value)
      .then(() => {
        callback(__Scheduler_succeed({}));
      })
      .catch((err) => {
        console.log("WriteableStream err: ", err);
        return callback(__Scheduler_fail(__Stream_Closed));
      })
      .finally(() => {
        writer.releaseLock();
      });
  });
});

var _Stream_makePair = __Scheduler_binding(function (callback) {
  const strategy = new CountQueuingStrategy({ highWaterMark: 3 });
  const transformStream = new TransformStream({}, strategy, strategy);

  return callback(
    __Scheduler_succeed({
      __$readable: transformStream.readable,
      __$writable: transformStream.writable,
    }),
  );
});
