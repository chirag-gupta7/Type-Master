## 2025-05-22 - [Optimizing N+1 queries in statistics endpoints]
**Learning:** Statistics endpoints that iterate over categories (like game types) to perform multiple database queries per category (e.g., count, max, average) create a significant performance bottleneck (N+1 query problem). This can be optimized using Prisma's `groupBy` and aggregate features (`_count`, `_max`, `_avg`) to fetch all required data in a single database roundtrip.
**Action:** Always check for loops containing database queries in controller logic. Prefer bulk data retrieval and in-memory mapping over sequential per-category queries.

## 2025-05-10 - Batching upserts in logMistakes
**Learning:** Sequential database roundtrips in a loop (O(n)) can be significantly optimized by aggregating data first and using Prisma transactions. Even when a native 'upsertMany' is missing, grouping by key and batching within a transaction reduces latency.
**Action:** Always look for loops containing database calls and consider if they can be aggregated or batched using `$transaction`.

## 2026-05-16 - [Optimizing Top-per-Group queries with Prisma distinct]
**Learning:** Fetching the "best" or "latest" record per category for a specific user (e.g., high score per game type) often leads to N+1 queries when looping through categories. This can be optimized to O(1) database roundtrips using Prisma's `distinct` property combined with `orderBy` (where the distinct field is the first sort key).
**Action:** Use `prisma.model.findMany({ distinct: ['category'], orderBy: [{ category: 'asc' }, { metric: 'desc' }] })` to fetch top records in bulk.
