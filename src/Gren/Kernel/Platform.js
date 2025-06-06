/*

import Gren.Kernel.Debug exposing (crash)
import Gren.Kernel.Json exposing (run, wrap, unwrap, errorToString)
import Gren.Kernel.Process exposing (sleep)
import Gren.Kernel.Scheduler exposing (andThen, binding, rawSend, rawSpawn, receive, send, succeed, fail)
import Array exposing (pushLast)
import Result exposing (isOk)

*/

// PROGRAMS

var _Platform_worker = F3(function (impl, flagDecoder, args) {
  return _Platform_initialize(
    flagDecoder,
    args,
    impl.__$init,
    impl.__$update,
    impl.__$subscriptions,
    function () {
      return function () {};
    },
  );
});

// INITIALIZE A PROGRAM

function _Platform_initialize(
  flagDecoder,
  args,
  init,
  update,
  subscriptions,
  stepperBuilder,
) {
  var result = A2(
    __Json_run,
    flagDecoder,
    __Json_wrap(args ? args["flags"] : undefined),
  );
  __Result_isOk(result) ||
    __Debug_crash(2 /**__DEBUG/, __Json_errorToString(result.a) /**/);

  _Platform_setupTaskPorts(args ? args["taskPorts"] : undefined);

  var managers = {};
  var initPair = init(result.a);
  var model = initPair.__$model;
  var stepper = stepperBuilder(sendToApp, model);
  var ports = _Platform_setupEffects(managers, sendToApp, executeCmd);

  function sendToApp(msg, viewMetadata) {
    var pair = A2(update, msg, model);
    stepper((model = pair.__$model), viewMetadata);
    _Platform_enqueueEffects(managers, pair.__$command, subscriptions(model));
  }

  function executeCmd(cmd) {
    _Platform_enqueueEffects(managers, cmd, subscriptions(model));
  }

  _Platform_enqueueEffects(managers, initPair.__$command, subscriptions(model));

  return ports ? { ports: ports } : {};
}

// TRACK PRELOADS
//
// This is used by code in gren/browser and gren/http
// to register any HTTP requests that are triggered by init.
//

var _Platform_preload;

function _Platform_registerPreload(url) {
  _Platform_preload.add(url);
}

// EFFECT MANAGERS

var _Platform_effectManagers = {};

function _Platform_setupEffects(managers, sendToApp, executeCmd) {
  var ports;

  // setup all necessary effect managers
  for (var key in _Platform_effectManagers) {
    var manager = _Platform_effectManagers[key];

    if (manager.__portSetup) {
      ports = ports || {};
      ports[key] = manager.__portSetup(key, sendToApp);
    }

    managers[key] = _Platform_instantiateManager(
      manager,
      sendToApp,
      executeCmd,
    );
  }

  return ports;
}

function _Platform_createManager(init, onEffects, onSelfMsg, cmdMap, subMap) {
  return {
    __init: init,
    __onEffects: onEffects,
    __onSelfMsg: onSelfMsg,
    __cmdMap: cmdMap,
    __subMap: subMap,
  };
}

function _Platform_instantiateManager(info, sendToApp, executeCmd) {
  var router = {
    __sendToApp: sendToApp,
    __executeCmd: executeCmd,
    __selfProcess: undefined,
  };

  var onEffects = info.__onEffects;
  var onSelfMsg = info.__onSelfMsg;
  var cmdMap = info.__cmdMap;
  var subMap = info.__subMap;

  function loop(state) {
    return A2(
      __Scheduler_andThen,
      loop,
      __Scheduler_receive(function (msg) {
        var value = msg.a;

        if (msg.$ === __2_SELF) {
          return A3(onSelfMsg, router, value, state);
        }

        return cmdMap && subMap
          ? A4(onEffects, router, value.__cmds, value.__subs, state)
          : A3(onEffects, router, cmdMap ? value.__cmds : value.__subs, state);
      }),
    );
  }

  return (router.__selfProcess = __Scheduler_rawSpawn(
    A2(__Scheduler_andThen, loop, info.__init),
  ));
}

// ROUTING

var _Platform_sendToApp = F2(function (router, msg) {
  return __Scheduler_binding(function (callback) {
    router.__sendToApp(msg);
    callback(__Scheduler_succeed({}));
  });
});

var _Platform_sendToSelf = F2(function (router, msg) {
  return A2(__Scheduler_send, router.__selfProcess, {
    $: __2_SELF,
    a: msg,
  });
});

var _Platform_executeCmd = F2(function (router, cmd) {
  return _Scheduler_binding(function (callback) {
    router.__executeCmd(cmd);
    callback(__Scheduler_succeed({}));
  });
});

// BAGS

function _Platform_leaf(home) {
  return function (value) {
    return {
      $: __2_LEAF,
      __home: home,
      __value: value,
    };
  };
}

function _Platform_batch(array) {
  return {
    $: __2_NODE,
    __bags: array,
  };
}

var _Platform_map = F2(function (tagger, bag) {
  return {
    $: __2_MAP,
    __func: tagger,
    __bag: bag,
  };
});

// PIPE BAGS INTO EFFECT MANAGERS
//
// Effects must be queued!
//
// Say your init contains a synchronous command, like Time.now or Time.here
//
//   - This will produce a batch of effects (FX_1)
//   - The synchronous task triggers the subsequent `update` call
//   - This will produce a batch of effects (FX_2)
//
// If we just start dispatching FX_2, subscriptions from FX_2 can be processed
// before subscriptions from FX_1. No good! Earlier versions of this code had
// this problem, leading to these reports:
//
//   https://github.com/gren/core/issues/980
//   https://github.com/gren/core/pull/981
//   https://github.com/gren/compiler/issues/1776
//
// The queue is necessary to avoid ordering issues for synchronous commands.

// Why use true/false here? Why not just check the length of the queue?
// The goal is to detect "are we currently dispatching effects?" If we
// are, we need to bail and let the ongoing while loop handle things.
//
// Now say the queue has 1 element. When we dequeue the final element,
// the queue will be empty, but we are still actively dispatching effects.
// So you could get queue jumping in a really tricky category of cases.
//
var _Platform_effectsQueue = [];
var _Platform_effectsActive = false;

function _Platform_enqueueEffects(managers, cmdBag, subBag) {
  _Platform_effectsQueue.push({
    __managers: managers,
    __cmdBag: cmdBag,
    __subBag: subBag,
  });

  if (_Platform_effectsActive) return;

  _Platform_effectsActive = true;
  while (_Platform_effectsQueue.length > 0) {
    const activeEffects = _Platform_effectsQueue;
    _Platform_effectsQueue = [];

    for (const fx of activeEffects) {
      _Platform_dispatchEffects(fx.__managers, fx.__cmdBag, fx.__subBag);
    }
  }
  _Platform_effectsActive = false;
}

function _Platform_dispatchEffects(managers, cmdBag, subBag) {
  var effectsDict = {};
  _Platform_gatherEffects(true, cmdBag, effectsDict, null);
  _Platform_gatherEffects(false, subBag, effectsDict, null);

  for (var home in managers) {
    __Scheduler_rawSend(managers[home], {
      $: "fx",
      a: effectsDict[home] || { __cmds: [], __subs: [] },
    });
  }
}

function _Platform_gatherEffects(isCmd, bag, effectsDict, taggers) {
  switch (bag.$) {
    case __2_LEAF:
      var home = bag.__home;
      var effect = _Platform_toEffect(isCmd, home, taggers, bag.__value);
      effectsDict[home] = _Platform_insert(isCmd, effect, effectsDict[home]);
      return;

    case __2_NODE:
      var bags = bag.__bags;
      for (var idx = 0; idx < bags.length; idx++) {
        _Platform_gatherEffects(isCmd, bags[idx], effectsDict, taggers);
      }
      return;

    case __2_MAP:
      _Platform_gatherEffects(isCmd, bag.__bag, effectsDict, {
        __tagger: bag.__func,
        __rest: taggers,
      });
      return;
  }
}

function _Platform_toEffect(isCmd, home, taggers, value) {
  function applyTaggers(x) {
    for (var temp = taggers; temp; temp = temp.__rest) {
      x = temp.__tagger(x);
    }
    return x;
  }

  var map = isCmd
    ? _Platform_effectManagers[home].__cmdMap
    : _Platform_effectManagers[home].__subMap;

  return A2(map, applyTaggers, value);
}

function _Platform_insert(isCmd, newEffect, effects) {
  effects = effects || { __cmds: [], __subs: [] };

  isCmd
    ? (effects.__cmds = A2(__Array_pushLast, newEffect, effects.__cmds))
    : (effects.__subs = A2(__Array_pushLast, newEffect, effects.__subs));

  return effects;
}

// PORTS

function _Platform_checkPortName(name) {
  if (_Platform_effectManagers[name]) {
    __Debug_crash(3, name);
  }

  if (_Platform_taskPorts[name]) {
    __Debug_crash(3, name);
  }
}

// OUTGOING PORTS

function _Platform_outgoingPort(name, converter) {
  _Platform_checkPortName(name);
  _Platform_effectManagers[name] = {
    __cmdMap: _Platform_outgoingPortMap,
    __converter: converter,
    __portSetup: _Platform_setupOutgoingPort,
  };
  return _Platform_leaf(name);
}

var _Platform_outgoingPortMap = F2(function (tagger, value) {
  return value;
});

function _Platform_setupOutgoingPort(name) {
  var subs = [];
  var converter = _Platform_effectManagers[name].__converter;

  // CREATE MANAGER

  var init = __Process_sleep(0);

  _Platform_effectManagers[name].__init = init;
  _Platform_effectManagers[name].__onEffects = F3(
    function (router, cmdArray, state) {
      for (var idx = 0; idx < cmdArray.length; idx++) {
        // grab a separate reference to subs in case unsubscribe is called
        var currentSubs = subs;
        var value = __Json_unwrap(converter(cmdArray[idx]));
        for (var subIdx = 0; subIdx < currentSubs.length; subIdx++) {
          currentSubs[subIdx](value);
        }
      }
      return init;
    },
  );

  // PUBLIC API

  function subscribe(callback) {
    subs.push(callback);
  }

  function unsubscribe(callback) {
    // copy subs into a new array in case unsubscribe is called within a
    // subscribed callback
    subs = subs.slice();
    var index = subs.indexOf(callback);
    if (index >= 0) {
      subs.splice(index, 1);
    }
  }

  return {
    subscribe: subscribe,
    unsubscribe: unsubscribe,
  };
}

// INCOMING PORTS

function _Platform_incomingPort(name, converter) {
  _Platform_checkPortName(name);
  _Platform_effectManagers[name] = {
    __subMap: _Platform_incomingPortMap,
    __converter: converter,
    __portSetup: _Platform_setupIncomingPort,
  };
  return _Platform_leaf(name);
}

var _Platform_incomingPortMap = F2(function (tagger, finalTagger) {
  return function (value) {
    return tagger(finalTagger(value));
  };
});

function _Platform_setupIncomingPort(name, sendToApp) {
  var subs = [];
  var converter = _Platform_effectManagers[name].__converter;

  // CREATE MANAGER

  var init = __Scheduler_succeed(null);

  _Platform_effectManagers[name].__init = init;
  _Platform_effectManagers[name].__onEffects = F3(
    function (router, subArray, state) {
      subs = subArray;
      return init;
    },
  );

  // PUBLIC API

  function send(incomingValue) {
    var result = A2(__Json_run, converter, __Json_wrap(incomingValue));

    __Result_isOk(result) || __Debug_crash(4, name, result.a);

    var value = result.a;
    for (var idx = 0; idx < subs.length; idx++) {
      sendToApp(subs[idx](value));
    }
  }

  return { send: send };
}

// TASK PORTS

var _Platform_taskPorts = {};

function _Platform_taskPort(name, inputConverter, converter) {
  _Platform_checkPortName(name);
  _Platform_taskPorts[name] = {};

  return function (input) {
    var encodedInput = inputConverter
      ? __Json_unwrap(inputConverter(input))
      : null;

    return __Scheduler_binding(function (callback) {
      var promise;
      try {
        promise = _Platform_taskPorts[name](encodedInput);
      } catch (e) {
        throw new Error(
          "Registered code for task-based port named '" + name + "'  crashed.",
          { cause: e },
        );
      }

      if (!(promise instanceof Promise)) {
        throw new Error(
          "Handler for task port named '" +
            name +
            "' did not return a Promise.",
        );
      }

      promise.then(
        function (value) {
          var result = A2(__Json_run, converter, __Json_wrap(value));

          __Result_isOk(result) || __Debug_crash(4, name, value);

          callback(__Scheduler_succeed(result.a));
        },
        function (err) {
          // If Error, convert to plain object. This is because Error doesn't have enumerable
          // properties.
          if (err instanceof Error) {
            var newErr = {};
            Object.getOwnPropertyNames(err).forEach(function (key) {
              newErr[key] = err[key];
            });

            err = newErr;
          }

          callback(__Scheduler_fail(__Json_wrap(err)));
        },
      );
    });
  };
}

function _Platform_setupTaskPorts(registeredPorts) {
  if (typeof registeredPorts !== "object") {
    registeredPorts = {};
  }

  for (var key in registeredPorts) {
    if (!(key in _Platform_taskPorts)) {
      // TODO: proper way to crash program
      throw new Error(
        key + " isn't defined as a task-based port in Gren code.",
      );
    }
  }

  for (var key in _Platform_taskPorts) {
    var handler = registeredPorts[key];
    if (!handler) {
      throw new Error("No handler defined for task port named '" + key + "'.");
    }

    if (!(handler instanceof Function)) {
      throw new Error(
        "Handler for task port named '" + key + "' is not a function.",
      );
    }

    _Platform_taskPorts[key] = handler;
  }
}

// EXPORT GREN MODULES
//
// Have DEBUG and PROD versions so that we can (1) give nicer errors in
// debug mode and (2) not pay for the bits needed for that in prod mode.
//

function _Platform_export__PROD(exports) {
  scope["Gren"]
    ? _Platform_mergeExportsProd(scope["Gren"], exports)
    : (scope["Gren"] = exports);
}

function _Platform_mergeExportsProd(obj, exports) {
  for (var name in exports) {
    name in obj
      ? name == "init"
        ? __Debug_crash(6)
        : _Platform_mergeExportsProd(obj[name], exports[name])
      : (obj[name] = exports[name]);
  }
}

function _Platform_export__DEBUG(exports) {
  scope["Gren"]
    ? _Platform_mergeExportsDebug("Gren", scope["Gren"], exports)
    : (scope["Gren"] = exports);
}

function _Platform_mergeExportsDebug(moduleName, obj, exports) {
  for (var name in exports) {
    name in obj
      ? name == "init"
        ? __Debug_crash(6, moduleName)
        : _Platform_mergeExportsDebug(
            moduleName + "." + name,
            obj[name],
            exports[name],
          )
      : (obj[name] = exports[name]);
  }
}
