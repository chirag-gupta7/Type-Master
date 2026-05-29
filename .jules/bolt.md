## 2025-05-22 - [Optimizing N+1 queries in statistics endpoints]
**Learning:** Statistics endpoints that iterate over categories (like game types) to perform multiple database queries per category (e.g., count, max, average) create a significant performance bottleneck (N+1 query problem). This can be optimized using Prisma's `groupBy` and aggregate features (`_count`, `_max`, `_avg`) to fetch all required data in a single database roundtrip.
**Action:** Always check for loops containing database queries in controller logic. Prefer bulk data retrieval and in-memory mapping over sequential per-category queries.

## 2025-05-10 - Batching upserts in logMistakes
**Learning:** Sequential database roundtrips in a loop (O(n)) can be significantly optimized by aggregating data first and using Prisma transactions. Even when a native 'upsertMany' is missing, grouping by key and batching within a transaction reduces latency.
**Action:** Always look for loops containing database calls and consider if they can be aggregated or batched using `$transaction`.

## 2025-05-29 - [Optimizing "Top Record Per Category" N+1 queries]
**Learning:** Fetching the single best record across multiple categories (e.g., high scores per game type) often leads to N+1 query patterns. This can be optimized into a single database roundtrip using `prisma.model.findMany` with the `distinct` property on the category field, combined with an appropriate `orderBy` (e.g., `score: 'desc'`).
**Action:** When you need the "winning" record for each group, use `findMany({ distinct: ['field'], orderBy: [...] })` instead of looping `findFirst`.
