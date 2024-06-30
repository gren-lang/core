/*

import Gren.Kernel.Scheduler exposing (binding, succeed, fail)
import Gren.Kernel.Bytes exposing (writeBytes)
import Crypto exposing (SignWithRsaSsaPkcs1V1_5Error, AesCtrEncryptionError, RsaOaepEncryptionError, P256, P384, P521, AesLength128, AesLength192, AesLength256, CanBeExtracted, CannotBeExtracted, HmacKey, Sha256, Sha384, Sha512, SignWithRsaPssError, AesGcmDecryptionError, AesGcmEncryptionError, AesCbcDecryptionError, AesCbcEncryptionError, AesCtrDecryptionError, DecryptWithRsaOaepError, ImportRsaKeyError, ImportHmacKeyError, ImportEcKeyError, ImportAesKeyError, Key, SecureContext, PublicKey, PrivateKey)
import Maybe exposing (Just, Nothing)
import Bytes exposing (Bytes)

*/

var crypto = function () {
    if (typeof window === 'undefined') {
        return require('crypto');
    }
    return window.crypto;
}();

// Utils

var _Crypto_hashFromString = function (__$hash) {
    switch (__$hash) {
        case "SHA-256":
            return __Crypto_Sha256;
        case "SHA-384":
            return __Crypto_Sha384;
        case "SHA-512":
            return __Crypto_Sha512;
    };
};

var _Crypto_extractableFromBool = function (__$extractable) {
    if (__$extractable) {
        return __Crypto_CanBeExtracted;
    } else {
        return __Crypto_CannotBeExtracted;
    };
};

// Key Construction

var _Crypto_constructRsaKey = function (__$key) {
    var rsaKeyData = {
        __$modulusLength: __$key.algorithm.modulusLength,
        __$publicExponent: __$key.algorithm.publicExponent,
        __$hash: _Crypto_hashFromString(__$key.algorithm.hash.name),
        __$extractable: _Crypto_extractableFromBool(__$key.extractable)
    };
    return A2(__Crypto_Key, __$key, rsaKeyData);
};

var _Crypto_constructHmacKey = function (__$key) {
    var hmacKeyData = {
        __$hash: _Crypto_hashFromString(__$key.algorithm.hash.name),
        __$extractable: _Crypto_extractableFromBool(__$key.extractable)
    };
    if (__$key.algorithm.length) {
        hmacKeyData.__$length = __Maybe_Just(__$key.algorithm.length);
    } else {
        hmacKeyData.__$length = __Maybe_Nothing
    }
    return A2(__Crypto_Key, __$key, hmacKeyData);
};

var _Crypto_constructAesKey = function (__$key) {
    var aesKeyData = {
        __$extractable: _Crypto_extractableFromBool(__$key.extractable)
    };
    switch (__$key.algorithm.length) {
        case 128:
            aesKeyData.__$length = __Crypto_AesLength128
        case 192:
            // Todo: I need to figure out how this works, given the cross-browser issues...
            // (I believe this fails in Safari? Due to security concerns?)
            // Fail in Gren when this is provided as a constructor? Fail here or in the 
            // function for key import?
            aesKeyData.__$length = __Crypto_AesLength192
        case 256:
            aesKeyData.__$length = __Crypto_AesLength256
    }
    return A2(__Crypto_Key, __$key, aesKeyData);
};

var _Crypto_constructEcKey = function (__$key) {
    var ecKeyData = {
        __$extractable: _Crypto_extractableFromBool(__$key.extractable)
    };
    switch (__$key.algorithm.namedCurve) {
        case "P-256":
            ecKeyData.__$namedCurve = __Crypto_P256;
        case "P-384":
            ecKeyData.__$namedCurve = __Crypto_P384;
        case "P-521":
            ecKeyData.__$namedCurve = __Crypto_P521;
    }
    return A2(__Crypto_Key, __$key, ecKeyData);
};

// Random

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
    var randomValues = crypto.getRandomValues(array);
    return __Scheduler_binding(function (callback) {
        return callback(__Scheduler_succeed(new DataView(randomValues.buffer)));
    })
});

// Context

var _Crypto_getContext = __Scheduler_binding(function (callback) {
    if (crypto.subtle) {
        return callback(__Scheduler_succeed(__Crypto_SecureContext));
    }
    return callback(__Scheduler_fail);
});

// Generate keys

var _Crypto_generateRsaKey = F6(function (name, modulusLength, publicExponent, hash, extractable, permissions) {
    var algorithm = {
        name: name,
        modulusLength: modulusLength,
        publicExponent: new Uint8Array(publicExponent),
        hash: hash
    }
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .generateKey(algorithm, extractable, permissions)
            .then(function (key) {
                return callback(__Scheduler_succeed(
                    {
                        __$publicKey: __Crypto_PublicKey(_Crypto_constructRsaKey(key.publicKey)),
                        __$privateKey: __Crypto_PrivateKey(_Crypto_constructRsaKey(key.privateKey))
                    }
                ))
            }).catch(function (err) {
                console.log(err);
            });
    });
});

var _Crypto_generateAesKey = F4(function (name, length, extractable, permissions) {
    var algorithm = {
        name: name,
        length: length
    }
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .generateKey(algorithm, extractable, permissions)
            .then(function (key) {
                return callback(__Scheduler_succeed(_Crypto_constructAesKey(key)))
            })
            .catch(function (err) {
                return callback(__Scheduler_fail(__Crypto_AesCtrEncryptionError))
            });
    });
});

var _Crypto_generateEcKey = F4(function (name, namedCurve, extractable, permissions) {
    var algorithm = {
        name: name,
        namedCurve: namedCurve
    }
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .generateKey(algorithm, extractable, permissions)
            .then(function (key) {
                return callback(__Scheduler_succeed(
                    {
                        __$publicKey: __Crypto_PublicKey(_Crypto_constructEcKey(key.publicKey)),
                        __$privateKey: __Crypto_PrivateKey(_Crypto_constructEcKey(key.privateKey))
                    }
                ))
            })
    })
});

var _Crypto_generateHmacKey = F5(function (name, hash, length, extractable, permissions) {
    var algorithm;
    if (length == "") {
        algorithm = {
            name: name,
            hash: hash
        }
    } else {
        algorithm = {
            name: name,
            hash: hash,
            length: length
        }
    }
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .generateKey(algorithm, extractable, permissions)
            .then(function (key) {
                return callback(__Scheduler_succeed(_Crypto_constructHmacKey(key)))
            })
            .catch(function (err) {
                return callback(__Scheduler_fail);
            });
    });
});

// Exprort key

var _Crypto_exportKey = F2(function (format, key) {
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .exportKey(format, key)
            .then(function (res) {
                switch (format) {
                    case "jwk":
                        return callback(__Scheduler_succeed(res));

                    default:
                        return callback(__Scheduler_succeed(new DataView(res)));
                };
            })
            .catch(function (err) {
            });
    });
});

// Import keys

var _Crypto_importRsaKey = F7(function (wrapper, format, keyData, algorithm, hash, extractable, keyUsages) {
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .importKey(format, keyData, { name: algorithm, hash: hash }, extractable, keyUsages)
            .then(function (key) {
                switch (wrapper) {
                    case "public":
                        return callback(__Scheduler_succeed(__Crypto_PublicKey(_Crypto_constructRsaKey(key))))
                    case "private":
                        return callback(__Scheduler_succeed(__Crypto_PrivateKey(_Crypto_constructRsaKey(key))))
                    default:
                        return callback(__Scheduler_fail(__Crypto_ImportRsaKeyError));
                }
            })
            .catch(function (err) {
                console.log(err);
                return callback(__Scheduler_fail(__Crypto_ImportRsaKeyError));
            })
    })
});

var _Crypto_importAesKey = F5(function (format, keyData, algorithm, extractable, keyUsages) {
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .importKey(format, keyData, { name: algorithm }, extractable, keyUsages)
            .then(function (key) {
                return callback(__Scheduler_succeed(_Crypto_constructAesKey(key)))
            })
            .catch(function (err) {
                return callback(__Scheduler_fail(__Crypto_ImportAesKeyError));
            });
    });
});

var _Crypto_importEcKey = F7(function (wrapper, format, keyData, algorithm, namedCurve, extractable, keyUsages) {
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .importKey(
                format,
                keyData,
                {
                    name: algorithm,
                    namedCurve: namedCurve
                },
                extractable,
                keyUsages)
            .then(function (key) {
                switch (wrapper) {
                    case "public":
                        return callback(__Scheduler_succeed(__Crypto_PublicKey(_Crypto_constructEcKey(key))))
                    case "private":
                        return callback(__Scheduler_succeed(__Crypto_PrivateKey(_Crypto_constructEcKey(key))))
                    default:
                        return callback(__Scheduler_fail(__Crypto_ImportEcKeyError));
                }
            })
            .catch(function (err) {
                return callback(__Scheduler_fail(__Crypto_ImportEcKeyError));
            })
    });
});

var _Crypto_importHmacKey = F7(function (format, keyData, algorithm, hash, length, extractable, keyUsages) {
    var algorithm;
    if (length == "") {
        algorithm = {
            name: algorithm,
            hash: hash
        }
    } else {
        algorithm = {
            name: algorithm,
            hash: hash,
            length: length
        }
    }
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .importKey(format, keyData, algorithm, extractable, keyUsages)
            .then(function (key) {
                return callback(__Scheduler_succeed(_Crypto_constructHmacKey(key)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail(__Crypto_ImportHmacKeyError));
            })
    });
});

// Encryption

var _Crypto_encryptWithRsaOaep = F3(function (label, key, bytes) {
    var algorithm;
    if (label == "") {
        algorithm = {
            name: "RSA-OAEP"
        }
    } else {
        algorithm = {
            name: "RSA-OAEP",
            label: label
        }
    };
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .encrypt(algorithm, key, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail(__Crypto_RsaOaepEncryptionError))
            });
    });
});

var _Crypto_encryptWithAesCtr = F4(function (counter, length, key, bytes) {
    var algorithm = {
        name: "AES-CTR",
        counter: counter,
        length: length
    };
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .encrypt(algorithm, key, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail(__Crypto_AesCtrEncryptionError));
            });
    });
});

var _Crypto_encryptWithAesCbc = F3(function (iv, key, bytes) {
    var algorithm = {
        name: "AES-CBC",
        iv: iv
    };
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .encrypt(algorithm, key, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail(__Crypto_AesCbcEncryptionError))
            });
    });
});

var _Crypto_encryptWithAesGcm = F5(function (iv, additionalData, tagLength, key, bytes) {
    var algorithm = {
        name: "AES-GCM",
        iv: iv
    };
    if (additionalData != "") {
        algorithm.additionalData = additionalData;
    };
    if (tagLength != "") {
        algorithm.tagLength = tagLength;
    };
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .encrypt(algorithm, key, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                console.log(err);
                return callback(__Scheduler_fail(__Crypto_AesGcmEncryptionError));
            });
    });
});

// Decrypt

var _Crypto_decryptWithRsaOaep = F3(function (label, key, bytes) {
    var algorithm;
    if (label == "") {
        algorithm = {
            name: "RSA-OAEP"
        }
    } else {
        algorithm = {
            name: "RSA-OAEP",
            label: label
        }
    };
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .decrypt(algorithm, key, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail(__Crypto_AesCtrDecryptionError));
            });
    });
});

var _Crypto_decryptWithAesCtr = F4(function (counter, length, key, bytes) {
    var algorithm = {
        name: "AES-CTR",
        counter: counter,
        length: length
    }
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .decrypt(algorithm, key, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail(__Crypto_AesCtrDecryptionError));
            });
    })
});

var _Crypto_decryptWithAesCbc = F3(function (iv, key, bytes) {
    var algorithm = {
        name: "AES-CBC",
        iv: iv
    };
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .decrypt(algorithm, key, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail(__Crypto_AesCbcDecryptionError))
            });
    });
});

var _Crypto_decryptWithAesGcm = F5(function (iv, additionalData, tagLength, key, bytes) {
    var algorithm = {
        name: "AES-GCM",
        iv: iv
    };
    if (additionalData != "") {
        algorithm.additionalData = additionalData;
    };
    if (tagLength != "") {
        algorithm.tagLength = tagLength;
    };
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            // For some reason, passing a DataView for encrypted bytes does not work on node
            // So, turned into Uint8Array to work on node _and_ browser platforms
            .decrypt(algorithm, key, new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength))
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail(__Crypto_AesGcmDecryptionError))
            });
    });
});

// Signing

var _Crypto_signWithRsaSsaPkcs1V1_5 = F2(function (key, bytes) {
    var algorithm = {
        name: "RSASSA-PKCS1-v1_5"
    }
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .sign(algorithm, key, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail(__Crypto_SignWithRsaSsaPkcs1V1_5Error));
            })
    })
});

var _Crypto_signWithRsaPss = F3(function (saltLength, key, bytes) {
    var algorithm = {
        name: "RSA-PSS",
        saltLength: saltLength
    };
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .sign(algorithm, key, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail());
            });
    });
});

var _Crypto_signWithEcdsa = F3(function (hash, key, bytes) {
    var algorithm = {
        name: "ECDSA",
        hash: hash
    };
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .sign(algorithm, key, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail());
            });
    });
});

var _Crypto_signWithHmac = F2(function (key, bytes) {
    var algorithm = {
        name: "HMAC"
    }
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .sign(algorithm, key, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail());
            });
    });
});

// Verify

var _Crypto_verifyWithRsaSsaPkcs1V1_5 = F3(function (key, signature, bytes) {
    var algorithm = {
        name: "RSASSA-PKCS1-v1_5"
    };
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .verify(algorithm, key, signature, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed());
            })
            .catch(function (err) {
                return callback(__Scheduler_fail());
            });
    });
});

var _Crypto_verifyWithRsaPss = F4(function (saltLength, key, signature, bytes) {
    var algorithm = {
        name: "RSA-PSS",
        saltLength: saltLength
    };
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .verify(algorithm, key, signature, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(res));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail());
            });
    });
});

var _Crypto_verifyWithEcdsa = F4(function (hash, key, signature, bytes) {
    var algorithm = {
        name: "ECDSA",
        hash: hash
    };
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .verify(algorithm, key, signature, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(res));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail());
            });
    });
});

var _Crypto_verifyWithHmac = F3(function (key, signature, bytes) {
    var algorithm = {
        name: "HMAC"
    }
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .verify(algorithm, key, signature, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(res));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail());
            });
    });
});

// Digest

var _Crypto_digest = F2(function (algorithm, bytes) {
    return __Scheduler_binding(function (callback) {
        crypto.subtle
            .digest(algorithm, bytes)
            .then(function (res) {
                return callback(__Scheduler_succeed(new DataView(res)));
            })
            .catch(function (err) {
                return callback(__Scheduler_fail());
            });
    });
});
