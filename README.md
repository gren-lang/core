# Core Libraries

Every Gren project needs this package!

It provides **basic functionality** like addition and subtraction as well as **data structures** like arrays, dictionaries, and sets.

> **New to Gren?** Go to [gren-lang.org](https://gren-lang.org) for an overview.


## Default Imports

The modules in this package are so common, that some of them are imported by default in all Gren files. So it is as if every Gren file starts with these imports:

```gren
import Basics exposing (..)
import Array exposing (Array)
import Maybe exposing (Maybe(..))
import Result exposing (Result(..))
import String exposing (String)
import Char exposing (Char)

import Debug

import Platform exposing (Program)
import Platform.Cmd as Cmd exposing (Cmd)
import Platform.Sub as Sub exposing (Sub)
```

The intention is to include things that are both extremely useful and very unlikely to overlap with anything that anyone will ever write in a library. By keeping the set of default imports relatively small, it also becomes easier to use whatever version of `map` suits your fancy. Finally, it makes it easier to figure out where the heck a function is coming from.
