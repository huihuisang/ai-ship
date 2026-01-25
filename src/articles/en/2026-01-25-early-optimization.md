---
title: "AI Makes Early Optimization More Valuable"
date: "2026-01-25"
tools: ["codex"]
category: "Work"
action_button:
  text: "Read the Chroma Original"
  url: "https://onevcat.com/2026/01/chroma/"
---

While writing Chroma (a Swift terminal syntax highlighting library) and `ca` (a highlighted replacement for `cat`), the most worth recording wasn’t the features themselves, but how AI amplified the value of performance optimization. Under continuous benchmark-driven iteration, tokenizer and renderer performance reached about 10x.

The method was simple: treat benchmarks as first-class citizens, let AI read the code, find hotspots, propose options, then estimate gains theoretically; make small changes, rerun benchmarks, and feed the results into the next round. Optimization becomes a scientific experiment of “hypothesis—verification—correction.” AI’s value isn’t a single genius micro-optimization; it’s lowering trial-and-error enough that we’re willing to finish the job.

Two representative optimizations make this clear: switching the tokenizer/renderer from a batch pipeline to streaming to systematically cut memory and copy costs; adding a fast path for ASCII-dominant real-world input distributions, with a safe fallback for non-ASCII. Neither is a “flash of inspiration,” but both require meticulous changes and validation—exactly the part AI is good at carrying.

Therefore, the old lesson that “premature optimization is the root of all evil” needs a new interpretation in the AI era. We used to avoid early optimization because trial-and-error was expensive; in AI-assisted development, those costs drop, and many optimizations can be laid out earlier and validated sooner. I increasingly believe that early optimization doesn’t violate engineering rationality; it’s actually a correct and efficient path.
