# unitconv

A small, dependency-free Python library for converting between units of
length and mass.

```python
>>> from unitconv import convert
>>> convert(5, "km", "m")
5000.0
>>> convert(1, "st", "lb")
14.0
```

## Units

| Dimension | Base | Units |
|-----------|------|-------|
| length    | m    | `m`, `km`, `cm`, `mm`, `in`, `ft`, `yd`, `mi` |
| mass      | kg   | `kg`, `g`, `mg`, `t`, `lb`, `oz`, `st` |

Common spelled-out names (`metre`, `feet`, `pounds`, ...) are accepted as
aliases.

## Behaviour

- `convert(value, from_unit, to_unit, places=4)` rounds the result to
  `places` decimal places.
- Converting between dimensions raises `IncompatibleUnitsError`.
- Unknown unit names raise `UnknownUnitError` (a `KeyError`).

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).
