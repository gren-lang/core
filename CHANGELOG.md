# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [7.5.0] - ?

### Added

- `Char.unitLength` tells you have many code units a `Char` consists of
- `Char.replacementChar` makes it easier to test if `Char.fromCode` was successful
- `String.firstIndexOfFrom` start an indexOf search from a specific index
- `String` index functions now has unit equivalent implementations
- `String.unitStartsWithFrom` lets you test if a specific substring starts from an offset in a larger string
- `Array.maxLength` contains the maximum length of an `Array`
- `Result.sequence` is like `Result.allOk` but only returns the first `Err` instead of all `Err`s

### Fixed

- `Array.initialize` and `Array.repeat` would crash if given a negative int
- `Array.initialize`, `Array.repeat` and `Array.Builder.empty` now clamps the length to a safe integer instead of potentially crashing
- `Stream.closeWritable` now resolves _after_ the stream has been closed
- `Stream` runtime exceptions (like `Debug.todo`) was caught in kernel code and returned a `Cancelled` error
- `String.fromInt` could return incorrect results for integers close to maximum int size
- `String.split` would split apart codepoints when passed the empty string as seperator
- `String.firstIndexOf`, `String.lastIndexOf`, `String.indices` now operate on code points.
- `Crypto` kernel module was missing `break` in certain switch-statements
- `Task.sequence` has improved performance for large sequences
- `Char.fromCode` crashed the program on invalid codepoints
- `Bytes.flatten` could copy the wrong bytes from incoming bytearrays
- `Bytes.toString` no longer drops initial BOM (Byte Order Mark)
- `Bytes.getHostEndianess` always returned LE
- `Bytes.Decode.fail` would crash the program
- `Bytes.Decode.bytes` would reference the original `Bytes` instead of copying it
- `Bytes` based `Flags`/`port`s didn't copied the underlying buffer, not the intended bytes
- `Json.Decode.errorToString` reported error fields in reverse order
- `Parser.chompIf`/`Parser.chompWhile` operated on code units, not code points
- `Parser.chompUntilEndOr` when reaching the end of the string, the column position was off by one
- `Parser.keyword` only considered ASCII letters, not unicode letters
- Improved the scheduler so callbacks passed to `Task.andThen` only ever run once, and that killed processes stay dead.

## [7.4.2] - 2026-04-29

### Fixed

- Fixed possible runtime exception in `String.popLast`
- Fixed value of `rest` when calling `String.popLast`, it was the last character when it should've been anything but
- Fixed `String.slice` when using negative indices in a `String` containing characters that were two units wide

## [7.4.1] - 2026-04-29

### Fixed

- When compiling without `--optimized`, `Char`s weren't properly wrapped in `String.foldlUnits` and `String.foldrUnits`
- Bad iteration logic in `String.foldrUnits`

## [7.4.0] - 2026-03-22

### Added

- Started changelog
- Support `Bytes` in flags and ports
- **New Modules**:
  - `String.Parser` for turning unstructuered `String` into structured data.
  - `String.Parser.Advanced` similar to `String.Parser` but with more options to handle errors
