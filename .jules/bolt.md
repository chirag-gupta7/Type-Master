## 2025-05-10 - Batching upserts in logMistakes
**Learning:** Sequential database roundtrips in a loop (O(n)) can be significantly optimized by aggregating data first and using Prisma transactions. Even when a native 'upsertMany' is missing, grouping by key and batching within a transaction reduces latency.
**Action:** Always look for loops containing database calls and consider if they can be aggregated or batched using `$transaction`.

## 2025-05-12 - Stats-caching for complex O(N) loops
**Learning:** For systems like achievements where each item in a loop might trigger different database queries (e.g., checking counts vs. max values), the most effective optimization is a "stats-caching" pattern. By pre-fetching all relevant user metrics in parallel using `Promise.all` before the loop, the evaluation logic can be made entirely synchronous, reducing latency by >50%.
**Action:** Identify loops where each iteration calls specialized database checkers. Refactor by pre-calculating a 'Stats' object and passing it to synchronous logic.
