/*

import Gren.Kernel.Scheduler exposing (binding, succeed)

*/

var _Crypto_randomUUID = function (_) {
    return __Scheduler_binding(function (callback) {
        var randomUUID;
        const crypto = require('crypto');
        randomUUID = crypto.randomUUID();
        return callback(__Scheduler_succeed(randomUUID));
    });
}
