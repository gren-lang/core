/*

import Maybe exposing (Just, Nothing)

*/


function _Array_length(array)
{
    return array.length;
}

var _Array_initialize = F3(function(size, offset, func)
{
    var result = new Array(size);

    for (var i = 0; i < size; i++)
    {
        result[i] = func(offset + i);
    }

    return result;
});

var _Array_get = F2(function(index, array)
{
    var length = array.length;
    if (index < 0 || index >= length) {
        return __Maybe_Nothing;
    }
        
    return __Maybe_Just(array[index]);
    
});

var _Array_set = F3(function(index, value, array)
{
    var length = array.length;
    if (index < 0 || index >= length) {
        return array;
    }
    
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[index] = value;
    
    return result;
});

var _Array_push = F2(function(value, array)
{
    var length = array.length;
    var result = new Array(length + 1);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[length] = value;
    return result;
});

var _Array_foldl = F3(function(func, acc, array)
{
    var length = array.length;

    for (var i = 0; i < length; i++)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _Array_foldr = F3(function(func, acc, array)
{
    for (var i = array.length - 1; i >= 0; i--)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _Array_map = F2(function(func, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = func(array[i]);
    }

    return result;
});

var _Array_indexedMap = F2(function(func, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = A2(func, i, array[i]);
    }

    return result;
});

var _Array_slice = F3(function(from, to, array)
{
    return array.slice(from, to);
});

var _Array_append = F3(function(left, right)
{
    return left.concat(right);
});
