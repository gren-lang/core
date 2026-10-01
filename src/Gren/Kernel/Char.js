/*

import Gren.Kernel.Utils exposing (chr)
import Char exposing (replacementChar)

*/

function _Char_toCode(char) {
  return char.codePointAt(0);
}

function _Char_fromCode(code) {
  try {
    return __Utils_chr(String.fromCodePoint(code));
  } catch (e) {
    return __Char_replacementChar;
  }
}
