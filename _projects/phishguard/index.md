---
title: PhishGuard
summary: ML-based phishing detection, built in 48h.
start: "2026-03"
end: "2026-03"
categories: [security, machine-learning]   # multiple allowed
tech: [Python, scikit-learn, Flask]
context: hackathon        # school | personal | hackathon | professional
course:                   # if context = school
team: 4 people
role: ML model and backend
status: completed         # completed | in-progress | archived
cover: cover.png          # relative to this folder
links:
  github: https://github.com/<username>/phishguard   # TODO: replace
  demo:
  report:
  video:
event: hackathon-x-2026   # optional: links to timeline
featured: true            # shown first
---

<!-- TODO: replace this whole description -->

Full project description in markdown.

## What it does

PhishGuard scores a URL and the page behind it, and flags the ones that look like phishing.

## How it works

1. Extract lexical features from the URL.
2. Fetch the page and extract structural features.
3. Score everything with a gradient-boosted classifier.

```python
from sklearn.ensemble import GradientBoostingClassifier

model = GradientBoostingClassifier().fit(X_train, y_train)
print(model.score(X_test, y_test))
```

Images stored in this folder can be referenced by file name alone:

![Placeholder cover image](cover.png)
