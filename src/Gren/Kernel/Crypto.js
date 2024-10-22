/*

import Gren.Kernel.Scheduler exposing (binding, succeed, fail)
import Gren.Kernel.Bytes exposing (writeBytes)
import Crypto exposing (RsaSsaPkcs1V1_5SigningError, RsaPssSigningError, AesCtrEncryptionError, RsaOaepEncryptionError, P256, P384, P521, AesLength128, AesLength192, AesLength256, CanBeExtracted, CannotBeExtracted, HmacKey, Sha256, Sha384, Sha512, SignWithRsaPssError, AesGcmDecryptionError, AesGcmEncryptionError, AesCbcDecryptionError, AesCbcEncryptionError, AesCtrDecryptionError, DecryptWithRsaOaepError, ImportRsaKeyError, ImportHmacKeyError, ImportEcKeyError, ImportAesKeyError, Key, SecureContext, PublicKey, PrivateKey)
import Maybe exposing (Just, Nothing)
import Bytes exposing (Bytes)

*/

var _Crypto_impl = (function () {
  if (typeof window === "undefined") {
    return require("crypto");
  }
  return window.crypto;
})();

// Utils

var _Crypto_hashFromString = function (hash) {
  switch (hash) {
    case "SHA-256":
      return __Crypto_Sha256;
    case "SHA-384":
      return __Crypto_Sha384;
    case "SHA-512":
      return __Crypto_Sha512;
  }
};

var _Crypto_extractableFromBool = function (extractable) {
  if (extractable) {
    return __Crypto_CanBeExtracted;
  } else {
    return __Crypto_CannotBeExtracted;
  }
};

// Key Construction

var _Crypto_constructRsaKey = function (key) {
  var rsaKeyData = {
    __$modulusLength: key.algorithm.modulusLength,
    __$publicExponent: key.algorithm.publicExponent,
    __$hash: _Crypto_hashFromString(key.algorithm.hash.name),
    __$extractable: _Crypto_extractableFromBool(key.extractable),
  };
  return A2(__Crypto_Key, key, rsaKeyData);
};

var _Crypto_constructHmacKey = function (key) {
  var hmacKeyData = {
    __$hash: _Crypto_hashFromString(key.algorithm.hash.name),
    __$extractable: _Crypto_extractableFromBool(key.extractable),
  };
  if (key.algorithm.length) {
    hmacKeyData.__$length = __Maybe_Just(key.algorithm.length);
  } else {
    hmacKeyData.__$length = __Maybe_Nothing;
  }
  return A2(__Crypto_Key, key, hmacKeyData);
};

var _Crypto_constructAesKey = function (key) {
  var aesKeyData = {
    __$extractable: _Crypto_extractableFromBool(key.extractable),
  };
  switch (key.algorithm.length) {
    case 128:
      aesKeyData.__$length = __Crypto_AesLength128;
    case 192:
      aesKeyData.__$length = __Crypto_AesLength192;
    case 256:
      aesKeyData.__$length = __Crypto_AesLength256;
  }
  return A2(__Crypto_Key, key, aesKeyData);
};

var _Crypto_constructEcKey = function (key) {
  var ecKeyData = {
    __$extractable: _Crypto_extractableFromBool(key.extractable),
  };
  switch (key.algorithm.namedCurve) {
    case "P-256":
      ecKeyData.__$namedCurve = __Crypto_P256;
    case "P-384":
      ecKeyData.__$namedCurve = __Crypto_P384;
    case "P-521":
      ecKeyData.__$namedCurve = __Crypto_P521;
  }
  return A2(__Crypto_Key, key, ecKeyData);
};

// Random

var _Crypto_randomUUID = __Scheduler_binding(function (callback) {
  var randomUUID = _Crypto_impl.randomUUID();
  return callback(__Scheduler_succeed(randomUUID));
});

var _Crypto_getRandomValues = F2(function (arrayLength, valueType) {
  return __Scheduler_binding(function (callback) {
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
    var randomValues = _Crypto_impl.getRandomValues(array);
    return callback(__Scheduler_succeed(new DataView(randomValues.buffer)));
  });
});

// Context

var _Crypto_getContext = __Scheduler_binding(function (callback) {
  if (_Crypto_impl.subtle) {
    return callback(__Scheduler_succeed(__Crypto_SecureContext));
  }
  return callback(__Scheduler_fail({}));
});

// Generate keys

var _Crypto_generateRsaKey = F6(
  function (
    name,
    modulusLength,
    publicExponent,
    hash,
    extractable,
    permissions,
  ) {
    return __Scheduler_binding(function (callback) {
      var algorithm = {
        name: name,
        modulusLength: modulusLength,
        publicExponent: new Uint8Array(publicExponent),
        hash: hash,
      };
      _Crypto_impl.subtle
        .generateKey(algorithm, extractable, permissions)
        .then(function (key) {
          return callback(
            __Scheduler_succeed({
              __$publicKey: __Crypto_PublicKey(
                _Crypto_constructRsaKey(key.publicKey),
              ),
              __$privateKey: __Crypto_PrivateKey(
                _Crypto_constructRsaKey(key.privateKey),
              ),
            }),
          );
        })
        .catch(function (err) {
          throw "There was an unforseen error that occured when attempting to generate an RSA key. This shouldn't happen! Please file a ticket in the `gren-lang/core` Github repo (https://github.com/gren-lang/core)";
        });
    });
  },
);

var _Crypto_generateAesKey = F4(
  function (name, length, extractable, permissions) {
    return __Scheduler_binding(function (callback) {
      var algorithm = {
        name: name,
        length: length,
      };
      _Crypto_impl.subtle
        .generateKey(algorithm, extractable, permissions)
        .then(function (key) {
          return callback(__Scheduler_succeed(_Crypto_constructAesKey(key)));
        })
        .catch(function (err) {
          return callback(__Scheduler_fail(__Crypto_AesCtrEncryptionError));
        });
    });
  },
);

var _Crypto_generateEcKey = F4(
  function (name, namedCurve, extractable, permissions) {
    return __Scheduler_binding(function (callback) {
      var algorithm = {
        name: name,
        namedCurve: namedCurve,
      };
      _Crypto_impl.subtle
        .generateKey(algorithm, extractable, permissions)
        .then(function (key) {
          return callback(
            __Scheduler_succeed({
              __$publicKey: __Crypto_PublicKey(
                _Crypto_constructEcKey(key.publicKey),
              ),
              __$privateKey: __Crypto_PrivateKey(
                _Crypto_constructEcKey(key.privateKey),
              ),
            }),
          );
        })
        .catch(function (err) {
          throw "There was an unforseen error that occured when attempting to generate an EC key. This shouldn't happen! Please file a ticket in the `gren-lang/core` Github repo (https://github.com/gren-lang/core)";
        });
    });
  },
);

var _Crypto_generateHmacKey = F5(
  function (name, hash, length, extractable, permissions) {
    return __Scheduler_binding(function (callback) {
      var algorithm;
      if (length == "") {
        algorithm = {
          name: name,
          hash: hash,
        };
      } else {
        algorithm = {
          name: name,
          hash: hash,
          length: length,
        };
      }
      _Crypto_impl.subtle
        .generateKey(algorithm, extractable, permissions)
        .then(function (key) {
          return callback(__Scheduler_succeed(_Crypto_constructHmacKey(key)));
        })
        .catch(function (err) {
          throw "There was an unforseen error that occured when attempting to generate an HMAC key. This shouldn't happen! Please file a ticket in the `gren-lang/core` Github repo (https://github.com/gren-lang/core)";
        });
    });
  },
);

// Exprort key

var _Crypto_exportKey = F2(function (format, key) {
  return __Scheduler_binding(function (callback) {
    _Crypto_impl.subtle
      .exportKey(format, key)
      .then(function (res) {
        switch (format) {
          case "jwk":
            return callback(__Scheduler_succeed(res));

          default:
            return callback(__Scheduler_succeed(new DataView(res)));
        }
      })
      .catch(function (err) {
        throw "There was an unforseen error that occured when exporting a key. This shouldn't happen! Please file a ticket in the `gren-lang/core` Github repo (https://github.com/gren-lang/core)";
      });
  });
});

// Import keys

var _Crypto_importRsaKey = F7(
  function (wrapper, format, keyData, algorithm, hash, extractable, keyUsages) {
    return __Scheduler_binding(function (callback) {
      _Crypto_impl.subtle
        .importKey(
          format,
          keyData,
          { name: algorithm, hash: hash },
          extractable,
          keyUsages,
        )
        .then(function (key) {
          switch (wrapper) {
            case "public":
              return callback(
                __Scheduler_succeed(
                  __Crypto_PublicKey(_Crypto_constructRsaKey(key)),
                ),
              );
            case "private":
              return callback(
                __Scheduler_succeed(
                  __Crypto_PrivateKey(_Crypto_constructRsaKey(key)),
                ),
              );
            default:
              return callback(__Scheduler_fail(__Crypto_ImportRsaKeyError));
          }
        })
        .catch(function (err) {
          return callback(__Scheduler_fail(__Crypto_ImportRsaKeyError));
        });
    });
  },
);

var _Crypto_importAesKey = F5(
  function (format, keyData, algorithm, extractable, keyUsages) {
    return __Scheduler_binding(function (callback) {
      _Crypto_impl.subtle
        .importKey(format, keyData, { name: algorithm }, extractable, keyUsages)
        .then(function (key) {
          return callback(__Scheduler_succeed(_Crypto_constructAesKey(key)));
        })
        .catch(function (err) {
          return callback(__Scheduler_fail(__Crypto_ImportAesKeyError));
        });
    });
  },
);

var _Crypto_importEcKey = F7(
  function (
    wrapper,
    format,
    keyData,
    algorithm,
    namedCurve,
    extractable,
    keyUsages,
  ) {
    return __Scheduler_binding(function (callback) {
      _Crypto_impl.subtle
        .importKey(
          format,
          keyData,
          {
            name: algorithm,
            namedCurve: namedCurve,
          },
          extractable,
          keyUsages,
        )
        .then(function (key) {
          switch (wrapper) {
            case "public":
              return callback(
                __Scheduler_succeed(
                  __Crypto_PublicKey(_Crypto_constructEcKey(key)),
                ),
              );
            case "private":
              return callback(
                __Scheduler_succeed(
                  __Crypto_PrivateKey(_Crypto_constructEcKey(key)),
                ),
              );
            default:
              return callback(__Scheduler_fail(__Crypto_ImportEcKeyError));
          }
        })
        .catch(function (err) {
          return callback(__Scheduler_fail(__Crypto_ImportEcKeyError));
        });
    });
  },
);

var _Crypto_importHmacKey = F7(
  function (
    format,
    keyData,
    passedAlgorithm,
    hash,
    length,
    extractable,
    keyUsages,
  ) {
    return __Scheduler_binding(function (callback) {
      var algorithm;
      if (length == "") {
        algorithm = {
          name: passedAlgorithm,
          hash: hash,
        };
      } else {
        algorithm = {
          name: passedAlgorithm,
          hash: hash,
          length: length,
        };
      }
      _Crypto_impl.subtle
        .importKey(format, keyData, algorithm, extractable, keyUsages)
        .then(function (key) {
          return callback(__Scheduler_succeed(_Crypto_constructHmacKey(key)));
        })
        .catch(function (err) {
          return callback(__Scheduler_fail(__Crypto_ImportHmacKeyError));
        });
    });
  },
);

// Encryption

var _Crypto_encryptWithRsaOaep = F3(function (label, key, bytes) {
  return __Scheduler_binding(function (callback) {
    var algorithm;
    if (label == "") {
      algorithm = {
        name: "RSA-OAEP",
      };
    } else {
      algorithm = {
        name: "RSA-OAEP",
        label: label,
      };
    }
    _Crypto_impl.subtle
      .encrypt(algorithm, key, bytes)
      .then(function (res) {
        return callback(__Scheduler_succeed(new DataView(res)));
      })
      .catch(function (err) {
        return callback(__Scheduler_fail(__Crypto_RsaOaepEncryptionError));
      });
  });
});

var _Crypto_encryptWithAesCtr = F4(function (counter, length, key, bytes) {
  return __Scheduler_binding(function (callback) {
    var algorithm = {
      name: "AES-CTR",
      counter: counter,
      length: length,
    };
    _Crypto_impl.subtle
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
  return __Scheduler_binding(function (callback) {
    var algorithm = {
      name: "AES-CBC",
      iv: iv,
    };
    _Crypto_impl.subtle
      .encrypt(algorithm, key, bytes)
      .then(function (res) {
        return callback(__Scheduler_succeed(new DataView(res)));
      })
      .catch(function (err) {
        return callback(__Scheduler_fail(__Crypto_AesCbcEncryptionError));
      });
  });
});

var _Crypto_encryptWithAesGcm = F5(
  function (iv, additionalData, tagLength, key, bytes) {
    return __Scheduler_binding(function (callback) {
      var algorithm = {
        name: "AES-GCM",
        iv: iv,
      };
      if (additionalData != "") {
        algorithm.additionalData = additionalData;
      }
      if (tagLength != "") {
        algorithm.tagLength = tagLength;
      }
      _Crypto_impl.subtle
        .encrypt(algorithm, key, bytes)
        .then(function (res) {
          return callback(__Scheduler_succeed(new DataView(res)));
        })
        .catch(function (err) {
          return callback(__Scheduler_fail(__Crypto_AesGcmEncryptionError));
        });
    });
  },
);

// Decrypt

var _Crypto_decryptWithRsaOaep = F3(function (label, key, bytes) {
  return __Scheduler_binding(function (callback) {
    var algorithm;
    if (label == "") {
      algorithm = {
        name: "RSA-OAEP",
      };
    } else {
      algorithm = {
        name: "RSA-OAEP",
        label: label,
      };
    }
    _Crypto_impl.subtle
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
  return __Scheduler_binding(function (callback) {
    var algorithm = {
      name: "AES-CTR",
      counter: counter,
      length: length,
    };
    _Crypto_impl.subtle
      .decrypt(algorithm, key, bytes)
      .then(function (res) {
        return callback(__Scheduler_succeed(new DataView(res)));
      })
      .catch(function (err) {
        return callback(__Scheduler_fail(__Crypto_AesCtrDecryptionError));
      });
  });
});

var _Crypto_decryptWithAesCbc = F3(function (iv, key, bytes) {
  return __Scheduler_binding(function (callback) {
    var algorithm = {
      name: "AES-CBC",
      iv: iv,
    };
    _Crypto_impl.subtle
      .decrypt(algorithm, key, bytes)
      .then(function (res) {
        return callback(__Scheduler_succeed(new DataView(res)));
      })
      .catch(function (err) {
        return callback(__Scheduler_fail(__Crypto_AesCbcDecryptionError));
      });
  });
});

var _Crypto_decryptWithAesGcm = F5(
  function (iv, additionalData, tagLength, key, bytes) {
    return __Scheduler_binding(function (callback) {
      var algorithm = {
        name: "AES-GCM",
        iv: iv,
      };
      if (additionalData != "") {
        algorithm.additionalData = additionalData;
      }
      if (tagLength != "") {
        algorithm.tagLength = tagLength;
      }
      _Crypto_impl.subtle
        // For some reason, passing a DataView for encrypted bytes does not work on node
        // So, turned into Uint8Array to work on node _and_ browser platforms
        .decrypt(
          algorithm,
          key,
          new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength),
        )
        .then(function (res) {
          return callback(__Scheduler_succeed(new DataView(res)));
        })
        .catch(function (err) {
          return callback(__Scheduler_fail(__Crypto_AesGcmDecryptionError));
        });
    });
  },
);

// Signing

var _Crypto_signWithRsaSsaPkcs1V1_5 = F2(function (key, bytes) {
  return __Scheduler_binding(function (callback) {
    var algorithm = {
      name: "RSASSA-PKCS1-v1_5",
    };
    _Crypto_impl.subtle
      .sign(algorithm, key, bytes)
      .then(function (res) {
        return callback(__Scheduler_succeed(new DataView(res)));
      })
      .catch(function (err) {
        return callback(__Scheduler_fail(__Crypto_RsaSsaPkcs1V1_5SigningError));
      });
  });
});

var _Crypto_signWithRsaPss = F3(function (saltLength, key, bytes) {
  return __Scheduler_binding(function (callback) {
    var algorithm = {
      name: "RSA-PSS",
      saltLength: saltLength,
    };
    _Crypto_impl.subtle
      .sign(algorithm, key, bytes)
      .then(function (res) {
        return callback(__Scheduler_succeed(new DataView(res)));
      })
      .catch(function (err) {
        return callback(__Scheduler_fail(__Crypto_RsaPssSigningError));
      });
  });
});

var _Crypto_signWithEcdsa = F3(function (hash, key, bytes) {
  return __Scheduler_binding(function (callback) {
    var algorithm = {
      name: "ECDSA",
      hash: hash,
    };
    _Crypto_impl.subtle
      .sign(algorithm, key, bytes)
      .then(function (res) {
        return callback(__Scheduler_succeed(new DataView(res)));
      })
      .catch(function (err) {
        throw "There was an unforseen error that occured when attempting to sign using the ECDSA algorithm. This shouldn't happen! Please file a ticket in the `gren-lang/core` Github repo (https://github.com/gren-lang/core)";
      });
  });
});

var _Crypto_signWithHmac = F2(function (key, bytes) {
  return __Scheduler_binding(function (callback) {
    var algorithm = {
      name: "HMAC",
    };
    _Crypto_impl.subtle
      .sign(algorithm, key, bytes)
      .then(function (res) {
        return callback(__Scheduler_succeed(new DataView(res)));
      })
      .catch(function (err) {
        throw "There was an unforseen error that occured when attempting to sign with the HMAC algorithm. This shouldn't happen! Please file a ticket in the `gren-lang/core` Github repo (https://github.com/gren-lang/core)";
      });
  });
});

// Verify

var _Crypto_verifyWithRsaSsaPkcs1V1_5 = F3(function (key, signature, bytes) {
  return __Scheduler_binding(function (callback) {
    var algorithm = {
      name: "RSASSA-PKCS1-v1_5",
    };
    _Crypto_impl.subtle
      .verify(algorithm, key, signature, bytes)
      .then(function (res) {
        return callback(__Scheduler_succeed());
      })
      .catch(function (err) {
        throw "There was an unforseen error that occured when attempting to verify with the RSA-SSA-PKCS v1.5 algorithm. This shouldn't happen! Please file a ticket in the `gren-lang/core` Github repo (https://github.com/gren-lang/core)";
      });
  });
});

var _Crypto_verifyWithRsaPss = F4(function (saltLength, key, signature, bytes) {
  return __Scheduler_binding(function (callback) {
    var algorithm = {
      name: "RSA-PSS",
      saltLength: saltLength,
    };
    _Crypto_impl.subtle
      .verify(algorithm, key, signature, bytes)
      .then(function (res) {
        return callback(__Scheduler_succeed());
      })
      .catch(function (err) {
        throw "There was an unforseen error that occured when attempting to verify with the RSA-PSS algorithm. This shouldn't happen! Please file a ticket in the `gren-lang/core` Github repo (https://github.com/gren-lang/core)";
      });
  });
});

var _Crypto_verifyWithEcdsa = F4(function (hash, key, signature, bytes) {
  return __Scheduler_binding(function (callback) {
    var algorithm = {
      name: "ECDSA",
      hash: hash,
    };
    _Crypto_impl.subtle
      .verify(algorithm, key, signature, bytes)
      .then(function (res) {
        return callback(__Scheduler_succeed(res));
      })
      .catch(function (err) {
        throw "There was an unforseen error that occured when attempting to verify with the ECDSA algorithm. This shouldn't happen! Please file a ticket in the `gren-lang/core` Github repo (https://github.com/gren-lang/core)";
      });
  });
});

var _Crypto_verifyWithHmac = F3(function (key, signature, bytes) {
  return __Scheduler_binding(function (callback) {
    var algorithm = {
      name: "HMAC",
    };
    _Crypto_impl.subtle
      .verify(algorithm, key, signature, bytes)
      .then(function (res) {
        return callback(__Scheduler_succeed(res));
      })
      .catch(function (err) {
        throw "There was an unforseen error that occured when attempting to verify with the HMAC algorithm. This shouldn't happen! Please file a ticket in the `gren-lang/core` Github repo (https://github.com/gren-lang/core)";
      });
  });
});

// Digest

var _Crypto_digest = F2(function (algorithm, bytes) {
  return __Scheduler_binding(function (callback) {
    _Crypto_impl.subtle
      .digest(algorithm, bytes)
      .then(function (res) {
        return callback(__Scheduler_succeed(new DataView(res)));
      })
      .catch(function (err) {
        throw "There was an unforseen error that occured when attempting to digest some bytes. This shouldn't happen! Please file a ticket in the `gren-lang/core` Github repo (https://github.com/gren-lang/core)";
      });
  });
});
