/*

import Stream exposing (Closed)
import Gren.Kernel.Scheduler exposing (binding, succeed, fail, rawSpawn)

*/

var _Stream_read = function(stream) {
  return __Scheduler_binding(function(callback) {
    stream.getReader()
      .read()
      .then(({ value }) => callback(__Scheduler_succeed(value)))
      .catch((err) => {
          console.log("Stream err: ", err);
          return callback(__Scheduler_fail(__Stream_Closed));
        }
      )
  });
};

var _Stream_write = F2(function(value, stream) {
  return __Scheduler_binding(function(callback) {
    stream.getWriter()
      .write(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
      .then(() => callback(__Scheduler_succeed({})))
      .catch((err) => {
          console.log("Stream err: ", err);
          return callback(__Scheduler_fail(__Stream_Closed));
        }
      )
  });
});
