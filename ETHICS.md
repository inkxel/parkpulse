# Open ethical question: should Chalked show a break-in/crime-risk layer at all?

This isn't a settled feature. It's paused, and posed here deliberately instead of shipped quietly, because the tradeoff is real on both sides.

## The case for it

Vehicle break-ins are a genuine, practical parking consideration — not an abstract one. Outside our own house, we've had multiple cars broken into and had a catalytic converter stolen. That street has fewer parking restrictions than most nearby blocks, which makes it *more* legally convenient to park there and, in our actual experience, a spot we're hesitant to use anyway. "Where can I legally park" and "where would I actually feel okay parking" are two different questions, and a tool that only answers the first one is quietly incomplete for people who've lived through the second.

The underlying data is already public — most major cities publish geocoded crime data openly. Surfacing it in a useful context isn't creating new information, just making existing public information easier to act on.

## The case against it

Recorded crime data isn't a clean measure of actual crime — it's a measure of *reported and recorded* incidents, and reporting/enforcement intensity correlates with neighborhood demographics and income in ways that don't track real risk. A "risk" overlay built on raw incident counts risks reproducing that bias: marking lower-income or over-policed neighborhoods as "riskier," reinforcing patterns that have real, documented harm to those communities' reputations and property values — not a hypothetical concern, other neighborhood-safety apps have taken real, warranted criticism for exactly this.

Raw counts are also just statistically misleading without real care: a denser or busier area shows more raw incidents even at a *lower* per-capita rate than a quiet one. A careless implementation doesn't just risk stigma, it risks being wrong.

There's also a scope-creep risk: the clearly-legitimate core of this project is "where can I legally park." Crime-risk is a different kind of claim — not legality, but a judgment about wisdom — and bundling it in risks dragging the whole project into a more contentious, harder-to-get-right space before the less controversial, more clearly useful core is even built.

## Where this stands

**Paused, not built, not in the near-term roadmap.** If it's built at all, it should only happen after this question gets real community input — not a solo call, given how easy it is to get this specific kind of feature wrong with good intentions. Candidate middle grounds worth surfacing in that discussion, not yet decided:

- Per-capita normalization instead of raw incident counts, if built at all
- Scoped specifically to vehicle break-ins/theft-from-vehicle, not general crime
- A coarse, area-level signal rather than precise block-by-block mapping
- Opt-in, off by default
- Explicit, visible caveats about data limitations wherever it's shown, not just in this doc

**Discuss here:** [github.com/inkxel/chalked/discussions/1](https://github.com/inkxel/chalked/discussions/1). This file states the tradeoff; the discussion is where it actually gets decided.
