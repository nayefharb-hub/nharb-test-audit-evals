# Contributing

Thanks for helping out. A few conventions keep the code and tests easy to review.

## Setup

```sh
python -m venv .venv
. .venv/bin/activate
pip install -e '.[test]'
pytest
```

## Tests

- One behaviour per test, named after the behaviour (`test_parse_rejects_missing_target_unit`).
- Conversion results are compared with exact equality. Tolerances such as
  `pytest.approx` hide rounding mistakes, which are exactly the bugs a unit
  converter is most likely to have.
- Tests only use the public API exported from `unitconv`.
- Tests must pass on their own and in any order.

## Accepted exceptions

Sometimes a test has a good reason to break one of the rules above. When it
does, put a comment directly above the offending line:

```python
# audit-accept: <rule> — <reason>
```

`<rule>` is a short name for the rule being broken (for example
`exact-equality` or `public-api`) and `<reason>` says why the exception is
needed. Reviewers check that the reason is still true whenever the code
around it changes; if it is not, remove the exception and fix the test.

## Commits

Keep commits small and focused, and describe the behaviour change in the
subject line.
