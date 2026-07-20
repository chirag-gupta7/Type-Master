## 2025-05-22 - [Optimizing N+1 queries in statistics endpoints]
**Learning:** Statistics endpoints that iterate over categories (like game types) to perform multiple database queries per category (e.g., count, max, average) create a significant performance bottleneck (N+1 query problem). This can be optimized using Prisma's `groupBy` and aggregate features (`_count`, `_max`, `_avg`) to fetch all required data in a single database roundtrip.
**Action:** Always check for loops containing database queries in controller logic. Prefer bulk data retrieval and in-memory mapping over sequential per-category queries.

## 2025-05-10 - Batching upserts in logMistakes
**Learning:** Sequential database roundtrips in a loop (O(n)) can be significantly optimized by aggregating data first and using Prisma transactions. Even when a native 'upsertMany' is missing, grouping by key and batching within a transaction reduces latency.
**Action:** Always look for loops containing database calls and consider if they can be aggregated or batched using `$transaction`.

## 2025-05-24 - Parallelizing bulk metric fetching
**Learning:** When refactoring N+1 queries into bulk fetches, use `Promise.all` to execute independent `count`, `aggregate`, and `findMany` queries in parallel. This minimizes the total response time to the duration of the slowest query rather than the sum of all queries.
**Action:** Always wrap independent bulk data retrieval queries in `Promise.all` when optimizing controllers.

## 2026-07-20 - Database-level Leaderboard Deduplication
**Learning:** In-memory deduplication of leaderboard query results fetched via simple `findMany` limits (e.g., `take: 100`) is both a performance risk and a correctness bug. If a subset of active users hold multiple top scores, they push out other unique users, resulting in less than the requested limit being displayed. Offloading grouping and sorting to the database via `groupBy` on `userId` first ensures exact and complete unique user results, while a subsequent batched `findMany` query with `OR` fetches full details efficiently.
**Action:** Avoid raw limit-and-filter patterns for leaderboards. Always use a two-stage `groupBy` and batched `findMany` details query to guarantee correct leaderboard sizes and optimal database indexing.
