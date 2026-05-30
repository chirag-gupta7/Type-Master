## 2025-05-22 - [Optimizing N+1 queries in statistics endpoints]
**Learning:** Statistics endpoints that iterate over categories (like game types) to perform multiple database queries per category (e.g., count, max, average) create a significant performance bottleneck (N+1 query problem). This can be optimized using Prisma's `groupBy` and aggregate features (`_count`, `_max`, `_avg`) to fetch all required data in a single database roundtrip.
**Action:** Always check for loops containing database queries in controller logic. Prefer bulk data retrieval and in-memory mapping over sequential per-category queries.

## 2025-05-10 - Batching upserts in logMistakes
**Learning:** Sequential database roundtrips in a loop (O(n)) can be significantly optimized by aggregating data first and using Prisma transactions. Even when a native 'upsertMany' is missing, grouping by key and batching within a transaction reduces latency.
**Action:** Always look for loops containing database calls and consider if they can be aggregated or batched using `$transaction`.

## 2025-05-24 - [Optimizing "top record per category" queries]
**Learning:** Fetching the best record (e.g., high score) for multiple categories in a loop creates an N+1 query problem. This can be optimized in Prisma/PostgreSQL using `findMany` with the `distinct` property. When using `distinct: ['category']`, the `orderBy` must start with `category` followed by the sorting criteria (e.g., `score: 'desc'`) to ensure the correct record is picked for each distinct value in a single roundtrip.
**Action:** Use `distinct` + `orderBy` to resolve N+1 patterns when fetching the "best" or "latest" record per category.
