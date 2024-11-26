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
        reader.releaseLock();

        if (done) {
          return callback(__Scheduler_fail(__Stream_Closed));
        }

        if (value instanceof Uint8Array) {
          value = new DataView(
            value.buffer,
            value.byteOffset,
            value.byteLength,
          );
        }

        callback(__Scheduler_succeed(value));
      })
      .catch((err) => {
        reader.releaseLock();
        callback(__Scheduler_fail(__Stream_Closed));
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
    writer.ready.then(() => {
      writer.write(value);
      writer.releaseLock();

      callback(__Scheduler_succeed(stream));
    });
  });
});

var _Stream_cancel = F2(function (reason, stream) {
  return __Scheduler_binding(function (callback) {
    stream.cancel(reason).then(() => {
      callback(__Scheduler_succeed({}));
    });
  });
});

var _Stream_closeWritable = function (stream) {
  return __Scheduler_binding(function (callback) {
    if (stream.locked) {
      return callback(__Scheduler_fail(__Stream_Locked));
    }

    const writer = stream.getWriter();
    writer.close();
    writer.releaseLock();

    callback(__Scheduler_succeed({}));
  });
};

var _Stream_pipeThrough = F2(function (transformer, readable) {
  return __Scheduler_binding(function (callback) {
    if (readable.locked || transformer.writable.locked) {
      return callback(__Scheduler_fail(__Stream_Locked));
    }

    const transformedReader = readable.pipeThrough(transformer);
    return callback(__Scheduler_succeed(transformedReader));
  });
});

var _Stream_pipeTo = F2(function (writable, readable) {
  return __Scheduler_binding(function (callback) {
    if (readable.locked || writable.locked) {
      return callback(__Scheduler_fail(__Stream_Locked));
    }

    readable.pipeTo(writable).then(() => {
      callback(__Scheduler_succeed({}));
    });
  });
});

var _Stream_identityTransformation = F2(function (readCapacity, writeCapacity) {
  return __Scheduler_binding(function (callback) {
    const transformStream = new TransformStream(
      {},
      new CountQueuingStrategy({ highWaterMark: writeCapacity }),
      new CountQueuingStrategy({ highWaterMark: readCapacity }),
    );

    return callback(__Scheduler_succeed(transformStream));
  });
});

var _Stream_customTransformation = F4(
  function (toAction, initState, readCapacity, writeCapacity) {
    return __Scheduler_binding(function (callback) {
      const transformStream = new TransformStream(
        {
          start() {
            this.state = initState;
          },
          transform(chunk, controller) {
            if (chunk instanceof Uint8Array) {
              chunk = new DataView(
                chunk.buffer,
                chunk.byteOffset,
                chunk.byteLength,
              );
            }

            const action = A2(toAction, this.state, chunk);
            switch (action.__$ctor) {
              case "UpdateState":
                this.state = action.__$state;
                break;
              case "Send":
                this.state = action.__$state;
                for (let value of action.__$send) {
                  if (value instanceof DataView) {
                    value = new Uint8Array(
                      value.buffer,
                      value.byteOffset,
                      value.byteLength,
                    );
                  }

                  controller.enqueue(value);
                }
                break;
              case "Close":
                for (let value of action.__$send) {
                  if (value instanceof DataView) {
                    value = new Uint8Array(
                      value.buffer,
                      value.byteOffset,
                      value.byteLength,
                    );
                  }

                  controller.enqueue(value);
                }
                controller.terminate();
                break;
              case "Cancel":
                controller.error(action.__$cancelReason);
                break;
            }
          },
        },
        new CountQueuingStrategy({ highWaterMark: writeCapacity }),
        new CountQueuingStrategy({ highWaterMark: readCapacity }),
      );

      return callback(__Scheduler_succeed(transformStream));
    });
  },
);

var _Stream_readable = function (transformStream) {
  return transformStream.readable;
};

var _Stream_writable = function (transformStream) {
  return transformStream.writable;
};

var _Stream_textEncoder = __Scheduler_binding(function (callback) {
  return callback(__Scheduler_succeed(new TextEncoderStream()));
});

var _Stream_textDecoder = __Scheduler_binding(function (callback) {
  return callback(__Scheduler_succeed(new TextDecoderStream()));
});

var _Stream_compressor = function (algo) {
  return __Scheduler_binding(function (callback) {
    return callback(__Scheduler_succeed(new CompressionStream(algo)));
  });
};

var _Stream_decompressor = function (algo) {
  return __Scheduler_binding(function (callback) {
    return callback(__Scheduler_succeed(new DecompressionStream(algo)));
  });
};
