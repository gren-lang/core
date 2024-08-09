/*

import Gren.Kernel.Debug exposing (crash)

*/

// MATH

var _Math_remainderBy = F2(function (b, a) {
  return a % b;
});

// https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/divmodnote-letter.pdf
var _Math_modBy = F2(function (modulus, x) {
  var answer = x % modulus;
  return modulus === 0
    ? __Debug_crash(11)
    : (answer > 0 && modulus < 0) || (answer < 0 && modulus > 0)
    ? answer + modulus
    : answer;
});

// CONSTANTS

var _Math_pi = Math.PI;
var _Math_e = Math.E;
var _Math_maxSafeInteger = Number.MAX_SAFE_INTEGER;
var _Math_minSafeInteger = Number.MIN_SAFE_INTEGER;
var _Math_maxFloat = Number.MAX_VALUE;

// TRIGONOMETRY

var _Math_cos = Math.cos;
var _Math_sin = Math.sin;
var _Math_tan = Math.tan;
var _Math_acos = Math.acos;
var _Math_asin = Math.asin;
var _Math_atan = Math.atan;
var _Math_atan2 = F2(Math.atan2);

// MORE MATH

var _Math_truncate = Math.trunc;
var _Math_ceiling = Math.ceil;
var _Math_floor = Math.floor;
var _Math_round = Math.round;
var _Math_sqrt = Math.sqrt;
var _Math_log = Math.log;
var _Math_log10 = Math.log10;
