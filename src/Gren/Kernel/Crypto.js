/*

import Gren.Kernel.Scheduler exposing (binding, succeed, fail)
import Gren.Kernel.Bytes exposing (writeBytes)
import Crypto exposing (KeyPair, Key, SecureContext, InsecureContext, Error, KeyIsNotExtractable, PublicKey, PrivateKey)
import Maybe exposing (Just, Nothing)
import Bytes exposing (Bytes)

*/

var crypto = function () {
    if (typeof window === 'undefined') {
        return require('crypto');
    }
    return window.crypto;
}();

var _Crypto_constructKey = function (key) {
    return __Crypto_Key({
        __$key: key,
        __$algorithm: key.__$algorithm,
        __$keyType: key.__$type,
        __$extractable: key.__$extractable,
        __$usages: key.__$usages
    });
};

var _Crypto_randomUUID = __Scheduler_binding(function (callback) {
    var randomUUID = crypto.randomUUID();
    return callback(__Scheduler_succeed(randomUUID));
});

var _Crypto_getRandomValues = F2(function (arrayLength, valueType) {
    var array;
    switch (valueType) {
        case "int8":
            array = new Int8Array(arrayLength);
            break;
        case "uint8":
            array = new Uint8Array(arrayLength);
            break;
        case "int16":
            array = new Int16Array(arrayLength);
            break;
        case "uint16":
            array = new Uint16Array(arrayLength);
            break;
        case "int32":
            array = new Int32Array(arrayLength);
            break;
        case "uint32":
            array = new Uint32Array(arrayLength);
            break;
        default:
            array = new Int8Array(0);
            break;
    }
    try {
        var randomValues = crypto.getRandomValues(array);
    } catch (err) {
        console.log("err", err);
    }
    return __Scheduler_binding(function (callback) {
        return callback(__Scheduler_succeed(randomValues));
    })
});

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
                        {
                            publicKey: __Crypto_PublicKey(_Crypto_constructKey(key.__$publicKey)),
                            privateKey: __Crypto_PrivateKey(_Crypto_constructKey(key.__$privateKey))
                        }
                    )
                    );
                } else {
                    return callback(__Scheduler_succeed(_Crypto_constructKey(key)));
                };
            });
    });
});

var _Crypto_importKey = F5(function (format, keyData, algorithm, extractable, keyUsages) {
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .importKey(format, keyData, algorithm, extractable, keyUsages)
            .then(function (key) {
                if (key.publicKey && key.privateKey) {
                    return callback(__Scheduler_succeed(
                        {
                            publicKey: __Crypto_PublicKey(_Crypto_constructKey(key.__$publicKey)),
                            privateKey: __Crypto_PrivateKey(_Crypto_constructKey(key.__$privateKey))
                        }

                    ));
                } else {
                    return callback(__Scheduler_succeed(_Crypto_constructKey(key)));
                };
            });
    });
});

var _Crypto_encrypt = F3(function (key, params, data) {
    return __Scheduler_binding(function (callback) {
        crypto.subtle.encrypt(params, key.__$a.key, data)
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
        crypto.subtle.decrypt(params, key.__$a.key, data)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail());
            })
    });
});

var _Crypto_exportKey = F2(function (format, key) {
    return __Scheduler_binding(function (callback) {
        crypto.subtle.exportKey(format, key)
            .then(function (res) {
                console.log("res", res);
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                console.log("err", err)
                return callback(__Scheduler_fail());
            });
    });
});

var _Crypto_importKey = function (key) {
    var format = "raw";
    return __Scheduler_binding(function (callback) {
        crypto.subtle.importKey(format, key, { name: "RSA-OAEP" }, true, ["encrypt", "decrypt", "wrapKey", "unwrapKey"])
            .then(function (res) {
                return callback(__Scheduler_succeed())
            })
    });
};
