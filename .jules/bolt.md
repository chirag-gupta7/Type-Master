## 2025-05-22 - [Optimizing N+1 queries in statistics endpoints]
**Learning:** Statistics endpoints that iterate over categories (like game types) to perform multiple database queries per category (e.g., count, max, average) create a significant performance bottleneck (N+1 query problem). This can be optimized using Prisma's `groupBy` and aggregate features (`_count`, `_max`, `_avg`) to fetch all required data in a single database roundtrip.
**Action:** Always check for loops containing database queries in controller logic. Prefer bulk data retrieval and in-memory mapping over sequential per-category queries.

## 2025-05-10 - Batching upserts in logMistakes
**Learning:** Sequential database roundtrips in a loop (O(n)) can be significantly optimized by aggregating data first and using Prisma transactions. Even when a native 'upsertMany' is missing, grouping by key and batching within a transaction reduces latency.
**Action:** Always look for loops containing database calls and consider if they can be aggregated or batched using `$transaction`.

## 2026-05-13 - [Batching achievement requirement checks]
**Learning:** Achievement systems that use individual checker functions for each achievement can lead to an O(N) database query problem during bulk checks. Pre-fetching all relevant user metrics (test counts, max WPM, accuracy, etc.) into a single stats object allows checkers to run as pure in-memory functions, reducing latency significantly.
**Action:** When implementing multi-achievement checks, always aggregate required metrics upfront and pass them to requirement checkers.
