## 2025-05-22 - [Optimizing N+1 queries in statistics endpoints]
**Learning:** Statistics endpoints that iterate over categories (like game types) to perform multiple database queries per category (e.g., count, max, average) create a significant performance bottleneck (N+1 query problem). This can be optimized using Prisma's `groupBy` and aggregate features (`_count`, `_max`, `_avg`) to fetch all required data in a single database roundtrip.
**Action:** Always check for loops containing database queries in controller logic. Prefer bulk data retrieval and in-memory mapping over sequential per-category queries.

## 2025-05-10 - Batching upserts in logMistakes
**Learning:** Sequential database roundtrips in a loop (O(n)) can be significantly optimized by aggregating data first and using Prisma transactions. Even when a native 'upsertMany' is missing, grouping by key and batching within a transaction reduces latency.
**Action:** Always look for loops containing database calls and consider if they can be aggregated or batched using `$transaction`.

## 2025-05-24 - [Bulk metric fetching for complex requirement checks]
**Learning:** Achievement systems or complex validation logic that check multiple different conditions (counts, max, existence) for a single entity can be optimized by identifying the superset of required data points and fetching them in a single `Promise.all` block. This transforms a sequence of O(N*M) or O(M) queries into a single parallelized roundtrip.
**Action:** Before implementing a series of conditional database checks, aggregate all necessary metrics into a single bulk fetch operation.
