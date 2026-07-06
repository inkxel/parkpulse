# ParkPulse

Drop a pin or enter an address, get the full read on street parking there: street sweeping schedule, time limits, meters (and whether they're free on weekends/evenings), and permit-parking zone status. (A break-in/vehicle-crime-risk layer is a paused, open question — see [ETHICS.md](ETHICS.md) and [Discussion #1](https://github.com/inkxel/parkpulse/discussions/1) — not something we're shipping without real input first.)

**Status: spec stage, research-informed.** No national data standard exists for this — every city publishes (or doesn't publish) its own parking data differently. The map itself is national from day one (US Census boundaries, always complete); actual parking-rule coverage grows jurisdiction by jurisdiction, shown honestly — supported areas in full color, everywhere else grayed out with a link to help add it. See [SPEC.md](SPEC.md) for the real data landscape and the coverage architecture, and **[COVERAGE.md](COVERAGE.md) for what's actually confirmed, city by city, browsable and growing.**

## Why this project exists

I normally ride a motorcycle — parking is a non-issue. But every time I take the car out in LA, I hesitate before I even leave the house, because deciphering street parking signage here is genuinely exhausting. Sweeping days, permit zones, meter hours that change on weekends — none of it is legible in the moment you actually need it.

The sharper version of this hit closer to home. We live in new construction, and Waymo cars keep parking across our driveway — we've been blocked in more than once. My best guess is their "safe to park here" data is stale: our house used to be an empty lot, and whatever dataset they're using to decide a spot is legal probably hasn't caught up. That's the part that actually got me building this. This isn't just a human annoyance anymore — we're deploying autonomous vehicles that need to know where they can and can't park, on the same fragmented, inconsistent, often-stale municipal data humans have been squinting at for decades. If a self-driving car can get it wrong on my own street, the underlying data problem is bigger than an app can fully solve — which is kind of the point. As much as this is meant to be a genuinely useful tool, it's also meant to be a visible argument for why curb and parking data needs a real, consolidated national standard. Every fragmented, half-published, undocumented dataset this project has to work around is evidence for that case.

## Disclaimer

This is informational only. It is not responsible for citations, towing, or any consequence of relying on it. **Always defer to posted physical signage over anything this shows.** The data here is aggregated from public sources and can be incomplete, outdated, or wrong — see SPEC.md for known staleness issues in specific datasets. If you see something wrong, please report it (see SPEC.md for the planned error-reporting flow) — but don't park on the strength of an app over what the sign in front of you says.

## License
MIT (see [LICENSE](LICENSE)).
