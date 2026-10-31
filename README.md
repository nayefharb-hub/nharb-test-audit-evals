# unitconv

A small, dependency-free Python library for converting between units of
length, mass and temperature.

```python
>>> from unitconv import convert
>>> convert(5, "km", "m")
Decimal('5000.0000')
>>> convert("26.2", "mi", "km")
Decimal('42.1648')
```

## Units

| Dimension | Base | Units |
|-----------|------|-------|
| length    | m    | `m`, `km`, `cm`, `mm`, `in`, `ft`, `yd`, `mi` |
| mass      | kg   | `kg`, `g`, `mg`, `t`, `lb`, `oz`, `st` |
| temperature | K  | `K`, `C`, `F` |

Common spelled-out names (`metre`, `feet`, `pounds`, ...) are accepted as
aliases. Temperature scales also accept `kelvin`, `celsius`, `fahrenheit`,
`degC` and `degF`.

Temperatures are converted as absolute readings (20 C is 68 F), not as
differences.

## Behaviour

- `convert(value, from_unit, to_unit, places=4)` returns a `Decimal`.
  All arithmetic is done in `Decimal`, so results are exact up to the final
  rounding step: the result is rounded to `places` decimal places using
  round-half-to-even, the same rule as Python's built-in `round()`.
- `value` may be an `int`, `str`, `Decimal` or `float`. Floats are read via
  `str()`, so `0.1` means one tenth, not its binary approximation.
- Converting between dimensions raises `IncompatibleUnitsError`.
- Unknown unit names raise `UnknownUnitError` (a `KeyError`).

## Parsing text

`evaluate()` takes a request written as text and converts it:

```python
>>> from unitconv import evaluate, parse
>>> evaluate("10 ft to m")
Decimal('3.0480')
>>> parse("98.6 F in C")
Request(value=Decimal('98.6'), from_unit='F', to_unit='C')
```

The accepted form is `<number> <unit> to <unit>` (`in` works in place of
`to`). Whitespace between the number and the unit is optional, so `5km to mi`
is fine. Anything else raises `ParseError`.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).
