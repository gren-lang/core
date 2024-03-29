/*

import Gren.Kernel.Scheduler exposing (binding, succeed)

*/

var crypto = function () {
    if (typeof window === 'undefined') {
        return require('crypto');
    }
    return window.crypto;
}

var _Crypto_randomUUID = function (_) {
    return __Scheduler_binding(function (callback) {
        var randomUUID = crypto().randomUUID();
        return callback(__Scheduler_succeed(randomUUID));
    });
}
