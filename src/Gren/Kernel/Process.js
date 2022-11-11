/*

import Gren.Kernel.Scheduler exposing (binding, succeed)

*/

function _Process_sleep(time) {
  return __Scheduler_binding(function (callback) {
    var id = setTimeout(function () {
      callback(__Scheduler_succeed({}));
    }, time);

    return function () {
      clearTimeout(id);
    };
  });
}
