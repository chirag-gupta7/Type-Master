# Token Policy — Why GRAPH_REPORT.md First

## The Math

- Full corpus: 187 files · ~108k words (`graphify-out/GRAPH_REPORT.md:3` / `manifest.json:1`)
- Full extraction without graph: 38,500 input tokens + 18,500 output tokens (`cost.json:5`)
- Graph report: 475 lines · 23,030 bytes · ~5,700 tokens (`GRAPH_REPORT.md:1`) = **85% saving**
- Full `glob **/*.ts` + `grep` + reading 10 files ≈ 20k–40k tokens wasted per task
- Scoped `graphify query --budget 1500` → 5–30 nodes, typically 1–2k tokens, with exact `source_location` citations

## Mandatory Sequence (Enforced by `.opencode/plugins/graphify.js:1`)

Every task **must** start with:

1. `read graphify-out/GRAPH_REPORT.md:1` (first 50 lines cover hubs + god nodes)
2. `graphify query "<natural language task>" --budget 1500` (BFS, returns subgraph with `source_file` + `source_location`)
3. Only then `read` the ≤3 files cited by the query

Direct reads without step 1–2 are a policy violation and cost ~6× more.

## Tooling Reference

- `graphify-out/graph.html:1` — 1MB interactive visual, community-colored
- `graphify-out/graph.json:1` — 1.2MB raw nodes/edges/hyperedges, GraphRAG-ready
- `graphify-out/.graphify_labels.json:1` — 140 community labels
- `graphify-out/cost.json:1` — token spend history (track growth)
- `graphify-out/manifest.json:1` — `mtime` + `ast_hash` per file; compare to `git diff --name-only HEAD` to detect staleness
- `graphify-out/.graphify_python:1` — interpreter for `$(cat graphify-out/.graphify_python) -m graphify`

## Query Budgeting

- `--budget 1500` default for exploratory tasks
- `--budget 500` for pinpoint tasks ("where is Button authenticated?")
- `--budget 3000` for cross-cutting tasks ("how does achievement unlocking flow end-to-end?")
- `graphify path "AuthRequest" "prisma"` — shortest path between concepts
- `graphify explain "getLearningDashboard"` — plain-language node explainer

## Visualization Fallback

If query returns too broad, open `graph.html` locally and search community name (e.g., "Lesson Controller API") to see its 28 nodes and hub edges.

## Cost Monitoring

After each task that touches code, check `cost.json` total. If it grows >10% without new files, you missed the incremental path — should have used `graphify --update` not full rebuild.

