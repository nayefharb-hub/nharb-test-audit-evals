# Contributing

## Setup

```
python -m venv .venv && . .venv/bin/activate
pip install -e .[dev]
pytest
```

The whole suite should run in a few seconds. Please keep it that way: prefer
calling library functions directly over going through the CLI, and use the
`clock` fixture (a fake clock) rather than real sleeps wherever time matters.

## Pull requests

- One change per pull request; reference the issue (`#123`) in the commit
  message.
- New behaviour needs a test. Bug fixes need a test that failed before the fix.
- Test names describe the behaviour being checked. Prefix with the issue number
  when a test pins a reported bug, e.g. `test_gh12_<behaviour>`.
- Known bugs that are not fixed yet can be recorded with
  `@pytest.mark.xfail(strict=True, reason="... (#issue)")`.

## Review conventions

Our review checklist asks for a few things in tests: exact assertions on
values, no real network access, no real sleeps. Sometimes a test has a good
reason to deviate. When it does, say so next to the code with a comment of
the form

```
# audit-accept: <rule> — <reason>
```

for example `# audit-accept: loose-assertion — the value is random`. Reviewers
treat the comment as a standing agreement, so keep the reason accurate: if the
code changes and the reason stops being true, fix the test and drop the
comment.
