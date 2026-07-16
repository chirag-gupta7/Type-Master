## 2025-05-22 - [Optimizing N+1 queries in statistics endpoints]
**Learning:** Statistics endpoints that iterate over categories (like game types) to perform multiple database queries per category (e.g., count, max, average) create a significant performance bottleneck (N+1 query problem). This can be optimized using Prisma's `groupBy` and aggregate features (`_count`, `_max`, `_avg`) to fetch all required data in a single database roundtrip.
**Action:** Always check for loops containing database queries in controller logic. Prefer bulk data retrieval and in-memory mapping over sequential per-category queries.

## 2025-05-10 - Batching upserts in logMistakes
**Learning:** Sequential database roundtrips in a loop (O(n)) can be significantly optimized by aggregating data first and using Prisma transactions. Even when a native 'upsertMany' is missing, grouping by key and batching within a transaction reduces latency.
**Action:** Always look for loops containing database calls and consider if they can be aggregated or batched using `$transaction`.

## 2025-05-24 - Parallelizing bulk metric fetching
**Learning:** When refactoring N+1 queries into bulk fetches, use `Promise.all` to execute independent `count`, `aggregate`, and `findMany` queries in parallel. This minimizes the total response time to the duration of the slowest query rather than the sum of all queries.
**Action:** Always wrap independent bulk data retrieval queries in `Promise.all` when optimizing controllers.

## 2025-05-26 - [Database-level aggregation for statistics]
**Learning:** Calculating statistics (stars, WPM, accuracy) in-memory using `.reduce()` after a `findMany` call can be extremely inefficient as the dataset grows (O(N) data transfer and processing). Using Prisma's `aggregate` feature (`_sum`, `_avg`, `_count`) moves this logic to the database, resulting in O(1) data transfer and significantly lower memory footprint on the backend.
**Action:** Always prefer database-level aggregation for calculating metrics over large datasets instead of fetching and processing in-memory.

## 2025-05-26 - [Environment-specific npx versioning]
**Learning:** Using `npx` without a version specifier can pull the latest major version (e.g., Prisma v7.x), which may introduce breaking changes or validation errors (like datasource URL support) not compatible with the project's current configuration (v6.x).
**Action:** Always use the pinned version from `package.json` (e.g., `npx prisma@6.19.0`) when running CLI tools in the sandbox to maintain environment consistency and avoid accidental lockfile modifications.
