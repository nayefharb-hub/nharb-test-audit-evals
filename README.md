# unitconv

A small, dependency-free Python library for converting between units of
length and mass.

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

Common spelled-out names (`metre`, `feet`, `pounds`, ...) are accepted as
aliases.

## Behaviour

- `convert(value, from_unit, to_unit, places=4)` returns a `Decimal`.
  All arithmetic is done in `Decimal`, so results are exact up to the final
  rounding step: the result is rounded to `places` decimal places using
  round-half-to-even, the same rule as Python's built-in `round()`.
- `value` may be an `int`, `str`, `Decimal` or `float`. Floats are read via
  `str()`, so `0.1` means one tenth, not its binary approximation.
- Converting between dimensions raises `IncompatibleUnitsError`.
- Unknown unit names raise `UnknownUnitError` (a `KeyError`).

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).
