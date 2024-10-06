/*

import Stream exposing (Closed)
import Gren.Kernel.Scheduler exposing (binding, succeed, fail, rawSpawn)

*/

var _Stream_read = function (stream) {
  return __Scheduler_binding(function (callback) {
    const reader = stream.getReader();
    reader
      .read()
      .then(({ value }) => {
        callback(__Scheduler_succeed(value));
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
