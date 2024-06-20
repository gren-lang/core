/*

import Gren.Kernel.Utils exposing (cmp)
import Basics exposing (EQ, LT)
import Maybe exposing (Just, Nothing)

*/

var _Array_length = function (array) {
  return array.length;
};

var _Array_initialize = F3(function (size, offset, func) {
  var result = new Array(size);

  for (var i = 0; i < size; i++) {
    result[i] = func(offset + i);
  }

  return result;
});

var _Array_get = F2(function (index, array) {
  var value = array.at(index);

  if (value === undefined) {
    return __Maybe_Nothing;
  }

  return __Maybe_Just(value);
});

var _Array_set = F3(function (index, value, array) {
  try {
    return array.with(index, value);
  } catch (e) {
    // assuming RangeError
    return array;
  }
});

var _Array_push = F2(function (value, array) {
  return array.concat(value);
});

var _Array_foldl = F3(function (func, acc, array) {
  for (var i = 0; i < array.length; i++) {
    acc = A2(func, array[i], acc);
  }

  return acc;
});

var _Array_foldr = F3(function (func, acc, array) {
  for (var i = array.length - 1; i >= 0; i--) {
    acc = A2(func, array[i], acc);
  }

  return acc;
});

var _Array_indexedFoldl = F3(function (func, acc, array) {
  for (var i = 0; i < array.length; i++) {
    acc = A3(func, i, array[i], acc);
  }

  return acc;
});

var _Array_indexedFoldr = F3(function (func, acc, array) {
  for (var i = array.length - 1; i >= 0; i--) {
    acc = A3(func, i, array[i], acc);
  }

  return acc;
});

var _Array_map = F2(function (func, array) {
  return array.map(func);
});

var _Array_indexedMap = F2(function (func, array) {
  return array.map(function (value, index) {
    return A2(func, index, value);
  });
});

var _Array_filter = F2(function (func, array) {
  return array.filter(func);
});

var _Array_flat = function (array) {
  return array.flat();
}

var _Array_flatMap = F2(function (func, array) {
  return array.flatMap(func);
});

var _Array_slice = F3(function (from, to, array) {
  return array.slice(from, to);
});

var _Array_append = F2(function (left, right) {
  return left.concat(right);
});

var _Array_reverse = function (array) {
  return array.toReversed();
};

var _Array_findFirst = F2(function (pred, array) {
  for (var i = 0; i < array.length; i++) {
    var element = array[i];

    if (pred(element)) {
      return __Maybe_Just(element);
    }
  }

  return __Maybe_Nothing;
});

var _Array_findLast = F2(function (pred, array) {
  for (var i = array.length - 1; i >= 0; i--) {
    var element = array[i];

    if (pred(element)) {
      return __Maybe_Just(element);
    }
  }

  return __Maybe_Nothing;
});

var _Array_map2 = F3(function (fn, as, bs) {
  var result = [];
  var lowestLength = as.length < bs.length ? as.length : bs.length;

  for (var i = 0; i < lowestLength; i++) {
    result.push(A2(fn, as[i], bs[i]));
  }

  return result;
});

var _Array_map3 = F4(function (fn, as, bs, cs) {
  var result = [];
  var lowestLength = [as.length, bs.length, cs.length].sort()[0];

  for (var i = 0; i < lowestLength; i++) {
    result.push(A3(fn, as[i], bs[i], cs[i]));
  }

  return result;
});

var _Array_sort = function (array) {
  return array.toSorted(function (a, b) {
    return __Utils_cmp(a, b);
  });
};

var _Array_sortBy = F2(function (fn, array) {
  return array.toSorted(function (a, b) {
    return __Utils_cmp(fn(a), fn(b));
  });
});

var _Array_sortWith = F2(function (fn, array) {
  return array.toSorted(function (a, b) {
    var ord = A2(fn, a, b);
    return ord === __Basics_EQ ? 0 : ord === __Basics_LT ? -1 : 1;
  });
});
