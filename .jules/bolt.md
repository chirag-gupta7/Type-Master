## 2025-05-22 - [Optimizing N+1 queries in statistics endpoints]
**Learning:** Statistics endpoints that iterate over categories (like game types) to perform multiple database queries per category (e.g., count, max, average) create a significant performance bottleneck (N+1 query problem). This can be optimized using Prisma's `groupBy` and aggregate features (`_count`, `_max`, `_avg`) to fetch all required data in a single database roundtrip.
**Action:** Always check for loops containing database queries in controller logic. Prefer bulk data retrieval and in-memory mapping over sequential per-category queries.

## 2025-05-10 - Batching upserts in logMistakes
**Learning:** Sequential database roundtrips in a loop (O(n)) can be significantly optimized by aggregating data first and using Prisma transactions. Even when a native 'upsertMany' is missing, grouping by key and batching within a transaction reduces latency.
**Action:** Always look for loops containing database calls and consider if they can be aggregated or batched using `$transaction`.

## 2026-05-15 - [Batching achievement checks with UserMetrics]
**Learning:** Checking multiple achievements sequentially by querying the database for each condition (N+1 problem) is extremely slow. By aggregating all necessary user statistics (counts, max, averages) in a single parallel batch of queries into a `UserMetrics` object, achievement checkers can be refactored into synchronous, pure functions. This reduces database roundtrips from O(N) to O(1) and simplifies testing.
**Action:** When evaluating multiple rules against the same user/entity, pre-fetch all potential requirements in one batch and use in-memory logic for the evaluation.

## 2025-05-24 - Parallelizing bulk metric fetching
**Learning:** When refactoring N+1 queries into bulk fetches, use `Promise.all` to execute independent `count`, `aggregate`, and `findMany` queries in parallel. This minimizes the total response time to the duration of the slowest query rather than the sum of all queries.
**Action:** Always wrap independent bulk data retrieval queries in `Promise.all` when optimizing controllers.

## 2026-07-22 - Parallelizing user-specific weak key analysis queries
**Learning:** Endpoints that analyze user activity patterns often fetch multiple unrelated datasets sequentially (e.g., weak keys, finger-specific raw errors, and recent mistakes). This blocks execution on each query consecutively. Wrapping these queries in `Promise.all` parallelizes the database workload, dramatically reducing endpoint response latency to the time of the slowest single query.
**Action:** Identify independent queries in user statistics or analysis endpoints and parallelize them via `Promise.all`.
