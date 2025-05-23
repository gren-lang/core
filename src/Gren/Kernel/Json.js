/*

import Json.Decode as Json exposing (Field, Index, OneOf, Failure, errorToString)
import Maybe exposing (Just, Nothing)
import Result exposing (Ok, Err, isOk)

*/

/**__DEBUG/
function _Json_errorToString(error)
{
	return __Json_errorToString(error);
}
//*/

// CORE DECODERS

function _Json_succeed(msg) {
  return {
    $: __1_SUCCEED,
    __msg: msg,
  };
}

function _Json_fail(msg) {
  return {
    $: __1_FAIL,
    __msg: msg,
  };
}

function _Json_decodePrim(decoder) {
  return { $: __1_PRIM, __decoder: decoder };
}

var _Json_decodeInt = _Json_decodePrim(function (value) {
  return typeof value !== "number"
    ? _Json_expecting("an INT", value)
    : Math.trunc(value) === value
      ? __Result_Ok(value)
      : isFinite(value) && !(value % 1)
        ? __Result_Ok(value)
        : _Json_expecting("an INT", value);
});

var _Json_decodeBool = _Json_decodePrim(function (value) {
  return typeof value === "boolean"
    ? __Result_Ok(value)
    : _Json_expecting("a BOOL", value);
});

var _Json_decodeFloat = _Json_decodePrim(function (value) {
  return typeof value === "number"
    ? __Result_Ok(value)
    : _Json_expecting("a FLOAT", value);
});

var _Json_decodeValue = _Json_decodePrim(function (value) {
  return __Result_Ok(_Json_wrap(value));
});

var _Json_decodeString = _Json_decodePrim(function (value) {
  return typeof value === "string"
    ? __Result_Ok(value)
    : value instanceof String
      ? __Result_Ok(value + "")
      : _Json_expecting("a STRING", value);
});

function _Json_decodeArray(decoder) {
  return { $: __1_ARRAY, __decoder: decoder };
}

function _Json_decodeNull(value) {
  return { $: __1_NULL, __value: value };
}

var _Json_decodeField = F2(function (field, decoder) {
  return {
    $: __1_FIELD,
    __field: field,
    __decoder: decoder,
  };
});

var _Json_decodeIndex = F2(function (index, decoder) {
  return {
    $: __1_INDEX,
    __index: index,
    __decoder: decoder,
  };
});

function _Json_decodeKeyValuePairs(decoder) {
  return {
    $: __1_KEY_VALUE,
    __decoder: decoder,
  };
}

function _Json_mapMany(f, decoders) {
  return {
    $: __1_MAP,
    __func: f,
    __decoders: decoders,
  };
}

var _Json_andThen = F2(function (callback, decoder) {
  return {
    $: __1_AND_THEN,
    __decoder: decoder,
    __callback: callback,
  };
});

function _Json_oneOf(decoders) {
  return {
    $: __1_ONE_OF,
    __decoders: decoders,
  };
}

// DECODING OBJECTS

var _Json_map1 = F2(function (f, d1) {
  return _Json_mapMany(f, [d1]);
});

var _Json_map2 = F3(function (f, d1, d2) {
  return _Json_mapMany(f, [d1, d2]);
});

var _Json_map3 = F4(function (f, d1, d2, d3) {
  return _Json_mapMany(f, [d1, d2, d3]);
});

var _Json_map4 = F5(function (f, d1, d2, d3, d4) {
  return _Json_mapMany(f, [d1, d2, d3, d4]);
});

var _Json_map5 = F6(function (f, d1, d2, d3, d4, d5) {
  return _Json_mapMany(f, [d1, d2, d3, d4, d5]);
});

var _Json_map6 = F7(function (f, d1, d2, d3, d4, d5, d6) {
  return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6]);
});

var _Json_map7 = F8(function (f, d1, d2, d3, d4, d5, d6, d7) {
  return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7]);
});

var _Json_map8 = F9(function (f, d1, d2, d3, d4, d5, d6, d7, d8) {
  return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7, d8]);
});

// DECODE

var _Json_runOnString = F2(function (decoder, string) {
  try {
    var value = JSON.parse(string);
    return _Json_runHelp(decoder, value);
  } catch (e) {
    return __Result_Err(
      __Json_Failure({
        __$message: "This is not valid JSON! " + e.message,
        __$value: _Json_wrap(string),
      }),
    );
  }
});

var _Json_run = F2(function (decoder, value) {
  return _Json_runHelp(decoder, _Json_unwrap(value));
});

function _Json_runHelp(decoder, value) {
  switch (decoder.$) {
    case __1_PRIM:
      return decoder.__decoder(value);

    case __1_NULL:
      return value === null
        ? __Result_Ok(decoder.__value)
        : _Json_expecting("null", value);

    case __1_ARRAY:
      if (!_Json_isArray(value)) {
        return _Json_expecting("an ARRAY", value);
      }
      return _Json_runArrayDecoder(decoder.__decoder, value);

    case __1_FIELD:
      var field = decoder.__field;
      if (typeof value !== "object" || value === null || !(field in value)) {
        return _Json_expecting(
          "an OBJECT with a field named `" + field + "`",
          value,
        );
      }
      var result = _Json_runHelp(decoder.__decoder, value[field]);
      return __Result_isOk(result)
        ? result
        : __Result_Err(__Json_Field({ __$name: field, __$error: result.a }));

    case __1_INDEX:
      var index = decoder.__index;
      if (!_Json_isArray(value)) {
        return _Json_expecting("an ARRAY", value);
      }
      if (index >= value.length) {
        return _Json_expecting(
          "a LONGER array. Need index " +
            index +
            " but only see " +
            value.length +
            " entries",
          value,
        );
      }
      var result = _Json_runHelp(decoder.__decoder, value[index]);
      return __Result_isOk(result)
        ? result
        : __Result_Err(__Json_Index({ __$index: index, __$error: result.a }));

    case __1_KEY_VALUE:
      if (typeof value !== "object" || value === null || _Json_isArray(value)) {
        return _Json_expecting("an OBJECT", value);
      }

      var keyValuePairs = [];
      for (var key in value) {
        if (value.hasOwnProperty(key)) {
          var result = _Json_runHelp(decoder.__decoder, value[key]);
          if (!__Result_isOk(result)) {
            return __Result_Err(
              __Json_Field({ __$name: key, __$error: result.a }),
            );
          }
          keyValuePairs.push({ __$key: key, __$value: result.a });
        }
      }
      return __Result_Ok(keyValuePairs);

    case __1_MAP:
      var answer = decoder.__func;
      var decoders = decoder.__decoders;
      for (var i = 0; i < decoders.length; i++) {
        var result = _Json_runHelp(decoders[i], value);
        if (!__Result_isOk(result)) {
          return result;
        }
        answer = answer(result.a);
      }
      return __Result_Ok(answer);

    case __1_AND_THEN:
      var result = _Json_runHelp(decoder.__decoder, value);
      return !__Result_isOk(result)
        ? result
        : _Json_runHelp(decoder.__callback(result.a), value);

    case __1_ONE_OF:
      var errors = [];

      var decoders = decoder.__decoders;
      for (var idx = 0; idx < decoders.length; idx++) {
        var result = _Json_runHelp(decoders[idx], value);
        if (__Result_isOk(result)) {
          return result;
        }
        errors.push(result.a);
      }

      return __Result_Err(__Json_OneOf(errors));

    case __1_FAIL:
      return __Result_Err(
        __Json_Failure({
          __$message: decoder.__msg,
          __$value: _Json_wrap(value),
        }),
      );

    case __1_SUCCEED:
      return __Result_Ok(decoder.__msg);
  }
}

function _Json_runArrayDecoder(decoder, value) {
  var len = value.length;
  var array = new Array(len);
  for (var i = 0; i < len; i++) {
    var result = _Json_runHelp(decoder, value[i]);
    if (!__Result_isOk(result)) {
      return __Result_Err(__Json_Index({ __$index: i, __$error: result.a }));
    }
    array[i] = result.a;
  }
  return __Result_Ok(array);
}

function _Json_isArray(value) {
  return (
    Array.isArray(value) ||
    (typeof FileList !== "undefined" && value instanceof FileList)
  );
}

function _Json_expecting(type, value) {
  return __Result_Err(
    __Json_Failure({
      __$message: "Expecting " + type,
      __$value: _Json_wrap(value),
    }),
  );
}

// EQUALITY

function _Json_equality(x, y) {
  if (x === y) {
    return true;
  }

  if (x.$ !== y.$) {
    return false;
  }

  switch (x.$) {
    case __1_SUCCEED:
    case __1_FAIL:
      return x.__msg === y.__msg;

    case __1_PRIM:
      return x.__decoder === y.__decoder;

    case __1_NULL:
      return x.__value === y.__value;

    case __1_ARRAY:
    case __1_KEY_VALUE:
      return _Json_equality(x.__decoder, y.__decoder);

    case __1_FIELD:
      return (
        x.__field === y.__field && _Json_equality(x.__decoder, y.__decoder)
      );

    case __1_INDEX:
      return (
        x.__index === y.__index && _Json_equality(x.__decoder, y.__decoder)
      );

    case __1_MAP:
      return (
        x.__func === y.__func && _Json_arrayEquality(x.__decoders, y.__decoders)
      );

    case __1_AND_THEN:
      return (
        x.__callback === y.__callback &&
        _Json_equality(x.__decoder, y.__decoder)
      );

    case __1_ONE_OF:
      return _Json_arrayEquality(x.__decoders, y.__decoders);
  }
}

function _Json_arrayEquality(aDecoders, bDecoders) {
  var len = aDecoders.length;
  if (len !== bDecoders.length) {
    return false;
  }
  for (var i = 0; i < len; i++) {
    if (!_Json_equality(aDecoders[i], bDecoders[i])) {
      return false;
    }
  }
  return true;
}

// ENCODE

var _Json_encode = F2(function (indentLevel, value) {
  return JSON.stringify(_Json_unwrap(value), null, indentLevel) + "";
});

function _Json_wrap__DEBUG(value) {
  return { $: __0_JSON, a: value };
}
function _Json_unwrap__DEBUG(value) {
  return value.a;
}

function _Json_wrap__PROD(value) {
  return value;
}
function _Json_unwrap__PROD(value) {
  return value;
}

function _Json_emptyArray() {
  return [];
}
function _Json_emptyObject() {
  return {};
}

var _Json_addField = F3(function (key, value, object) {
  object[key] = _Json_unwrap(value);
  return object;
});

function _Json_addEntry(func) {
  return F2(function (entry, array) {
    array.push(_Json_unwrap(func(entry)));
    return array;
  });
}

var _Json_encodeNull = _Json_wrap(null);
