/*

import Gren.Kernel.Utils exposing (chr)

*/

function _Char_toCode(char) {
  return char.codePointAt(0);
}

function _Char_fromCode(code) {
  return __Utils_chr(String.fromCodePoint(code));
}
