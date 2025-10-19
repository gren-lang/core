/*

import Maybe exposing (Just, Nothing)

*/

// CREATE

var _Regex_never = /.^/;

var _Regex_fromStringWith = F2(function (options, string) {
  if (string.trim().length === 0) {
    return __Maybe_Nothing;
  }

  var flags = "gu";
  if (options.__$multiline) {
    flags += "m";
  }
  if (options.__$caseInsensitive) {
    flags += "i";
  }

  try {
    return __Maybe_Just(new RegExp(string, flags));
  } catch (error) {
    return __Maybe_Nothing;
  }
});

// USE

var _Regex_contains = F2(function (re, string) {
  return string.match(re) !== null;
});

var _Regex_findAtMost = F3(function (n, re, str) {
  var out = [];
  var number = 0;
  var string = str;
  var lastIndex = re.lastIndex;
  var prevLastIndex = -1;
  var result;
  while (number++ < n && (result = re.exec(string))) {
    if (prevLastIndex == re.lastIndex) break;
    var i = result.length - 1;
    var subs = new Array(i);
    while (i > 0) {
      var submatch = result[i];
      subs[--i] = submatch ? __Maybe_Just(submatch) : __Maybe_Nothing;
    }
    out.push({
      __$match: result[0],
      __$index: result.index,
      __$number: number,
      __$submatches: subs,
    });
    prevLastIndex = re.lastIndex;
  }
  re.lastIndex = lastIndex;
  return out;
});

var _Regex_replaceAtMost = F4(function (n, re, replacer, string) {
  var count = 0;
  function jsReplacer(match) {
    if (count++ >= n) {
      return match;
    }
    var i = arguments.length - 3;
    var submatches = new Array(i);
    while (i > 0) {
      var submatch = arguments[i];
      submatches[--i] = submatch ? __Maybe_Just(submatch) : __Maybe_Nothing;
    }
    return replacer({
      __$match: match,
      __$index: arguments[arguments.length - 2],
      __$number: count,
      __$submatches: submatches,
    });
  }
  return string.replace(re, jsReplacer);
});

var _Regex_splitAtMost = F3(function (n, re, str) {
  return str.split(re, n);
});
