/*

import Gren.Kernel.Scheduler exposing (binding, succeed, fail)
import Gren.Kernel.Bytes exposing (writeBytes)
import Crypto exposing (KeyPair, Key, SecureContext, InsecureContext, DecryptionError)
import Maybe exposing (Just, Nothing)
import Bytes exposing (Bytes)

*/

var crypto = function () {
    if (typeof window === 'undefined') {
        return require('crypto');
    }
    return window.crypto;
}();

var _Crypto_randomUUID = __Scheduler_binding(function (callback) {
    var randomUUID = crypto.randomUUID();
    return callback(__Scheduler_succeed(randomUUID));
});

var _Crypto_getRandomValues = function (arrayLength) {
    return __Scheduler_binding(function (callback) {
        var array = new Int8Array(arrayLength);
        var randomValues = crypto.getRandomValues(array);
        return callback(__Scheduler_succeed(randomValues));
    })
};

var _Crypto_getContext = __Scheduler_binding(function (callback) {
    if (crypto.subtle) {
        return callback(__Scheduler_succeed(__Crypto_SecureContext));
    }
    return callback(__Scheduler_fail);
});

var _Crypto_generateKey = F3(function (algorithm, extractable, permissions) {
    if (algorithm.__$publicExponent) {
        // Creating a new Uint8Array if the passed algorithm contains a publicExponent
        // Unsure how to pass this value directly from Gren and this is the current workaround
        algorithm.__$publicExponent = new Uint8Array(algorithm.__$publicExponent);
    }
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .generateKey(algorithm, extractable, permissions)
            .then(function (key) {
                if (key.publicKey && key.privateKey) {
                    return callback(__Scheduler_succeed(
                        __Crypto_KeyPair(
                            {
                                publicKey: __Crypto_Key(key.__$publicKey),
                                privateKey: __Crypto_Key(key.__$privateKey)
                            }
                        )
                    ));
                } else {
                    return callback(__Scheduler_succeed(__Crypto_Key(key)));
                };
            });
    });
});

var _Crypto_encrypt = F3(function (key, params, data) {
    return __Scheduler_binding(function (callback) {
        crypto.subtle.encrypt(params, key.__$a, data)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail(err));
            });
    });
});

var _Crypto_decrypt = F3(function (key, params, data) {
    return __Scheduler_binding(function (callback) {
        crypto.subtle.decrypt(params, key.__$a, data)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                console.log("err", err);
                return callback(__Scheduler_fail(__Crypto_DecryptionError));
            })
    });
});
