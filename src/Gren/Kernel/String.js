/*

import Gren.Kernel.Utils exposing (chr)
import Maybe exposing (Just, Nothing)

*/

var _String_pushFirst = F2(function (char, string) {
  return char + string;
});

var _String_pushLast = F2(function (char, string) {
  return string + char;
});

var _String_popFirst = function (string) {
  if (string.length <= 0) {
    return __Maybe_Nothing;
  }

  var firstPointNumber = string.codePointAt(0);
  var firstChar = String.fromCodePoint(firstPointNumber);

  return __Maybe_Just({
    __$first: __Utils_chr(firstChar),
    __$rest: string.slice(firstChar.length),
  });
};

var _String_popLast = function (string) {
  if (string.length <= 0) {
    return __Maybe_Nothing;
  }

  var possibleLastPointIdx = string.length - 2;
  var possibleLastPoint = string.codePointAt(possibleLastPointIdx);

  if (possibleLastPoint === string.charCodeAt(possibleLastPointIdx)) {
    // last char is a unit
    return __Maybe_Just({
      __$last: __Utils_chr(string[string.length - 1]),
      __$rest: string.slice(string.length - 1),
    });
  }

  // last char is a point
  return __Maybe_Just({
    __$last: __Utils_chr(String.fromCodePoint(possibleLastPoint)),
    __$rest: string.slice(string.length - 2),
  });
};

var _String_append = F2(function (a, b) {
  return a + b;
});

var _String_repeat = F2(function (num, chunk) {
  try {
    return chunk.repeat(num);
  } catch (error) {
    if (error.name === "RangeError") {
      return "";
    } else {
      throw error;
    }
  }
});

var _String_foldl = F3(function (func, state, string) {
  for (let char of string) {
    state = A2(func, __Utils_chr(char), state);
  }

  return state;
});

var _String_foldr = F3(function (func, state, string) {
  let reversed = [];

  for (let char of string) {
    reversed.unshift(char);
  }

  for (let char of reversed) {
    state = A2(func, __Utils_chr(char), state);
  }

  return state;
});

var _String_split = F2(function (sep, str) {
  return str.split(sep);
});

var _String_join = F2(function (sep, strs) {
  return strs.join(sep);
});

var _String_slice = F3(function (start, end, str) {
  if (start < 0) {
    start = str.length + start;
  }

  if (end < 0) {
    end = str.length + end;
  }

  if (start >= end) {
    return "";
  }

  let index = 0;
  let result = "";

  for (let char of str) {
    if (index < start) {
      index++;
      continue;
    }

    if (index >= end) {
      break;
    }

    result += char;
    index++;
  }

  return result;
});

function _String_trim(str) {
  return str.trim();
}

function _String_trimLeft(str) {
  return str.replace(/^\s+/, "");
}

function _String_trimRight(str) {
  return str.replace(/\s+$/, "");
}

function _String_words(str) {
  return str.trim().split(/\s+/g);
}

function _String_lines(str) {
  return str.split(/\r\n|\r|\n/g);
}

function _String_toUpper(str) {
  return str.toUpperCase();
}

function _String_toLower(str) {
  return str.toLowerCase();
}

var _String_any = F2(function (isGood, string) {
  for (let char of string) {
    if (isGood(__Utils_chr(char))) {
      return true;
    }
  }

  return false;
});

var _String_contains = F2(function (sub, str) {
  return str.indexOf(sub) > -1;
});

var _String_startsWith = F2(function (sub, str) {
  return str.indexOf(sub) === 0;
});

var _String_endsWith = F2(function (sub, str) {
  return (
    str.length >= sub.length && str.lastIndexOf(sub) === str.length - sub.length
  );
});

var _String_indexOf = F2(function (sub, str) {
  var ret = str.indexOf(sub);

  if (ret > -1) {
    return __Maybe_Just(ret);
  }

  return __Maybe_Nothing;
});

var _String_lastIndexOf = F2(function (sub, str) {
  var ret = str.lastIndexOf(sub);

  if (ret > -1) {
    return __Maybe_Just(ret);
  }

  return __Maybe_Nothing;
});

var _String_indexes = F2(function (sub, str) {
  var subLen = sub.length;

  if (subLen < 1) {
    return [];
  }

  var i = 0;
  var is = [];

  while ((i = str.indexOf(sub, i)) > -1) {
    is.push(i);
    i = i + subLen;
  }

  return is;
});

// TO STRING

function _String_fromNumber(number) {
  return number + "";
}

// INT CONVERSIONS

function _String_toInt(str) {
  var total = 0;
  var code0 = str.charCodeAt(0);
  var start = code0 == 0x2b /* + */ || code0 == 0x2d /* - */ ? 1 : 0;

  for (var i = start; i < str.length; ++i) {
    var code = str.charCodeAt(i);
    if (code < 0x30 || 0x39 < code) {
      return __Maybe_Nothing;
    }
    total = 10 * total + code - 0x30;
  }

  return i == start
    ? __Maybe_Nothing
    : __Maybe_Just(code0 == 0x2d ? -total : total);
}

// FLOAT CONVERSIONS

function _String_toFloat(s) {
  // check if it is a hex, octal, or binary number
  if (s.length === 0 || /[\sxbo]/.test(s)) {
    return __Maybe_Nothing;
  }
  var n = +s;
  // faster isNaN check
  return n === n ? __Maybe_Just(n) : __Maybe_Nothing;
}

function _String_fromArray(chars) {
  return chars.join("");
}

// UNITS

var _String_unitLength = function (str) {
  return str.length;
};

var _String_getUnit = F2(function (index, str) {
  var ret = str.at(index);

  if (typeof ret === "undefined") {
    return __Maybe_Nothing;
  }

  return __Maybe_Just(__Utils_chr(char));
});

var _String_foldlUnits = F3(function (fn, state, str) {
  for (let i = 0; i < str.length; i++) {
    state = A2(fn, str[i], state);
  }

  return state;
});

var _String_foldrUnits = F3(function (fn, state, str) {
  for (let i = str.length - 1; i < 0; i--) {
    state = A2(fn, str[i], state);
  }

  return state;
});
