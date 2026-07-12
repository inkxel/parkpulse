# Error-report → GitHub Issue pipeline

Design for SPEC.md's "User-reported errors, Google-Maps-style, auto-routed to GitHub Issues" section, including its explicit open requirement: don't ship the naive "instant anonymous direct post" version without an anti-spam/moderation step.

## The anti-spam decision: no backend, no anonymous posting — that IS the moderation step

Chalked is a static site (`index.html` + `app.js`, served with `python3 -m http.server` locally, no server-side component). Auto-filing an anonymous report straight to the GitHub Issues API requires either a committed API token shipped to every browser (a straightforward credential leak — anyone could extract it from the page source and spam-file issues, or worse, use it for anything else that token can do) or a serverless proxy function (real infrastructure this project doesn't have yet, and a whole new abuse surface — rate limiting, CAPTCHA, moderation queue — to build and maintain just to enable anonymous posting).

**The actual implementation: a prefilled GitHub issue-creation link, not an API call.** `app.js` builds a URL like:

```
https://github.com/inkxel/chalked/issues/new?template=data-issue.yml&title=...&jurisdiction=...&category=...
```

GitHub's own issue-form prefill feature (query params matching each form field's `id`) fills in what Chalked already knows (jurisdiction, category, a starting title) — the user reviews, adds what they observed, and submits themselves, through GitHub's own UI, under their own GitHub account.

This isn't a workaround for lacking a backend — **requiring a real GitHub account to submit is the anti-spam/moderation step**, not a placeholder for one. It's the same posture Google Maps' "report a problem" flow has implicitly (tied to a Google account) and it costs nothing to build or run: no token to leak, no rate-limiter to maintain, no moderation queue to staff, and GitHub's own spam/abuse tooling (account-level, not Chalked's problem) already applies to whatever gets filed. The tradeoff — a genuinely anonymous user can't report anything — is the right one at this project's current size; revisit only if "needs a GitHub account" turns out to meaningfully suppress real reports once there's actual traffic to observe.

## Two report types, two templates

SPEC.md calls for labeling by jurisdiction + category, in a label family (`data-issue`) distinct from the `epic`/`ready`/`blocked` planning labels already in use — see `.github/ISSUE_TEMPLATE/`:

- **`data-issue.yml`** — the general case: a shown status/schedule/zone that's wrong. Fields: jurisdiction, category (dropdown: sweeping/meters/permits/crime/other), what was observed, optional photo/link. Applies the `data-issue` label automatically (GitHub creates the label on first use if it doesn't already exist — no repo-settings step required to ship this).
- **`unsigned-rule.yml`** — the Walnut, CA case (`research/municipal-code-hosting.md`): a real rule with no posted sign at all, so "always defer to the sign" doesn't apply. Fields: jurisdiction, the rule itself (as specific as the reporter can make it), an optional municipal-code citation. Applies `data-issue` + `unsigned-rule`. This is the pipeline extension SPEC.md's Next Steps calls for separately ("Extend the error-report pipeline to accept 'my city has an unsigned rule like X' as its own report type") — implemented as a second template rather than a branching field on the first, since the two report shapes genuinely don't share fields (one has a category dropdown and a location, the other has a code citation and no category at all).

City/category-specific labels (`city:los-angeles`, `category:permits`) are deliberately **not** auto-applied by the templates — a single template covers every jurisdiction/category combination, so there's no clean way to prefill those without per-jurisdiction template duplication. A maintainer adds them during triage instead; this is a manual step today; automating it (e.g. a GitHub Action that labels based on the jurisdiction field's text) is a reasonable future improvement once report volume justifies it, not needed for a first version.

## Where the link appears in the UI

Each of the three category status panels (`renderPanel`/`renderMeterPanel`/`renderPermitPanel` in `app.js`) gets a "Report a problem →" link, built by a shared `reportIssueUrl(category, jurisdictionLabel, contextHint)` helper — jurisdiction and category arrive prefilled since the app already knows them from whichever zone/point the user clicked; only "what did you observe" is left for the user to fill in.

The unsigned-rule template isn't linked from any specific panel (there's no zone to click for a rule with no geometry at all) — it's reachable from the disclaimer/footer area instead, alongside the general "not covered yet — help us add it" link, since both are entry points a user reaches without having clicked a specific data feature.

## What this doesn't solve yet

- No moderation *within* GitHub Issues itself once filed — a filed issue is public immediately, same as any other GitHub issue. Acceptable at this size (same trust model as any other open-source repo's issue tracker); would need real triage tooling (auto-close obvious spam, require maintainer label before it's "actionable") if volume grows.
- No structured way to turn a resolved `data-issue` into an actual data fix yet — today that's still a human reading the issue and updating the relevant adapter/dataset by hand. A future improvement, not blocking this pipeline's usefulness today.
