/*

import Stream exposing (Locked, Closed, Cancelled)
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
        callback(
          __Scheduler_fail(
            __Stream_Cancelled(_Stream_cancellationErrorString(err)),
          ),
        );
      });
  });
};

var _Stream_cancellationErrorString = function (err) {
  if (err instanceof Error) {
    return err.toString();
  }

  if (typeof err === "string") {
    return err;
  }

  return "Unknown error";
};

// One FIFO chain per WritableStream, shared by every writer-acquiring
// operation (write, enqueue, closeWritable). Concurrent operations on the same
// stream serialize through this chain instead of colliding on
// getWriter()/releaseLock(), which would otherwise surface a spurious `Locked`
// because the lock is acquired synchronously but released in a later microtask.
var _Stream_writeChains = new WeakMap();

function _Stream_writeNoop() {}

// Schedule `work` (which must acquire and release its own writer) on the
// per-stream FIFO chain. Returns a promise that resolves with `work`'s outcome.
// The chain itself is kept alive on both success and failure
// (`run.then(noop, noop)`) so one failed write can't starve the queue. If
// `work` rejects with { __grenStreamLocked: true } the caller translates it to
// the `Locked` error.
function _Stream_runChained(stream, work) {
  var prev = _Stream_writeChains.get(stream);
  if (!prev) {
    prev = Promise.resolve();
  }
  var run = prev.then(work);
  _Stream_writeChains.set(
    stream,
    run.then(_Stream_writeNoop, _Stream_writeNoop),
  );
  return run;
}

// Rejects the promise with the sentinel value that identifies an error of Locked.
function _Stream_rejectLocked() {
  return Promise.reject({ __grenStreamLocked: true });
}

// Routes the settled `run` promise to a Scheduler callback, mapping the
// `__grenStreamLocked` sentinel to `Locked` and everything else to `Cancelled`.
function _Stream_reportRun(run, callback, onSuccess) {
  run.then(
    function () {
      callback(onSuccess());
    },
    function (err) {
      if (err && err.__grenStreamLocked) {
        callback(__Scheduler_fail(__Stream_Locked));
      } else {
        callback(
          __Scheduler_fail(
            __Stream_Cancelled(_Stream_cancellationErrorString(err)),
          ),
        );
      }
    },
  );
}

function _Stream_toUint8Array(value) {
  if (value instanceof DataView) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  return value;
}

var _Stream_write = F2(function (value, stream) {
  return __Scheduler_binding(function (callback) {
    var bytes = _Stream_toUint8Array(value);
    var run = _Stream_runChained(stream, function () {
      if (stream.locked) {
        return _Stream_rejectLocked();
      }
      var writer = stream.getWriter();
      return writer.ready.then(function () {
        var writePromise = writer.write(bytes);
        writer.releaseLock();
        return writePromise;
      });
    });

    _Stream_reportRun(run, callback, function () {
      return __Scheduler_succeed(stream);
    });
  });
});

var _Stream_enqueue = F2(function (value, stream) {
  return __Scheduler_binding(function (callback) {
    var bytes = _Stream_toUint8Array(value);
    var run = _Stream_runChained(stream, function () {
      if (stream.locked) {
        return _Stream_rejectLocked();
      }
      var writer = stream.getWriter();
      return writer.ready.then(function () {
        writer.write(bytes);
        writer.releaseLock();
      });
    });

    _Stream_reportRun(run, callback, function () {
      return __Scheduler_succeed(stream);
    });
  });
});

var _Stream_cancelReadable = F2(function (reason, stream) {
  return __Scheduler_binding(function (callback) {
    if (stream.locked) {
      return callback(__Scheduler_fail(__Stream_Locked));
    }

    stream.cancel(reason).then(() => {
      callback(__Scheduler_succeed({}));
    });
  });
});

var _Stream_cancelWritable = F2(function (reason, stream) {
  return __Scheduler_binding(function (callback) {
    if (stream.locked) {
      return callback(__Scheduler_fail(__Stream_Locked));
    }

    stream.abort(reason).then(() => {
      callback(__Scheduler_succeed({}));
    });
  });
});

var _Stream_closeWritable = function (stream) {
  return __Scheduler_binding(function (callback) {
    var run = _Stream_runChained(stream, function () {
      if (stream.locked) {
        return _Stream_rejectLocked();
      }
      var writer = stream.getWriter();
      return writer.close().then(
        function () {
          writer.releaseLock();
        },
        function (err) {
          writer.releaseLock();
          throw err;
        },
      );
    });

    _Stream_reportRun(run, callback, function () {
      return __Scheduler_succeed({});
    });
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

    readable
      .pipeTo(writable)
      .then(() => {
        callback(__Scheduler_succeed({}));
      })
      .catch((err) => {
        callback(
          __Scheduler_fail(
            __Stream_Cancelled(_Stream_cancellationErrorString(err)),
          ),
        );
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
