## 2025-05-22 - [Optimizing N+1 queries in statistics endpoints]
**Learning:** Statistics endpoints that iterate over categories (like game types) to perform multiple database queries per category (e.g., count, max, average) create a significant performance bottleneck (N+1 query problem). This can be optimized using Prisma's `groupBy` and aggregate features (`_count`, `_max`, `_avg`) to fetch all required data in a single database roundtrip.
**Action:** Always check for loops containing database queries in controller logic. Prefer bulk data retrieval and in-memory mapping over sequential per-category queries.

## 2025-05-10 - Batching upserts in logMistakes
**Learning:** Sequential database roundtrips in a loop (O(n)) can be significantly optimized by aggregating data first and using Prisma transactions. Even when a native 'upsertMany' is missing, grouping by key and batching within a transaction reduces latency.
**Action:** Always look for loops containing database calls and consider if they can be aggregated or batched using `$transaction`.

## 2026-05-25 - [Optimizing user statistics with database aggregation]
**Learning:** Fetching a user's entire history (O(N) data) just to calculate averages and maximums in-memory is a major performance anti-pattern. Prisma's `aggregate` feature allows these calculations to happen at the database level, returning O(1) data. Combining this with a limited `findMany` (e.g., `take: 10`) for recent records using `Promise.all` provides a significant speed boost for power users with many records.
**Action:** Always prefer database-level aggregation for statistical endpoints. Never fetch full datasets just to perform simple math in Node.js.
