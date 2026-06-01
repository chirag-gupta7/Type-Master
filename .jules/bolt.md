## 2025-05-22 - [Optimizing N+1 queries in statistics endpoints]
**Learning:** Statistics endpoints that iterate over categories (like game types) to perform multiple database queries per category (e.g., count, max, average) create a significant performance bottleneck (N+1 query problem). This can be optimized using Prisma's `groupBy` and aggregate features (`_count`, `_max`, `_avg`) to fetch all required data in a single database roundtrip.
**Action:** Always check for loops containing database queries in controller logic. Prefer bulk data retrieval and in-memory mapping over sequential per-category queries.

## 2025-05-10 - Batching upserts in logMistakes
**Learning:** Sequential database roundtrips in a loop (O(n)) can be significantly optimized by aggregating data first and using Prisma transactions. Even when a native 'upsertMany' is missing, grouping by key and batching within a transaction reduces latency.
**Action:** Always look for loops containing database calls and consider if they can be aggregated or batched using `$transaction`.

## 2026-06-01 - Offloading aggregations to the database
**Learning:** Performing statistical calculations (sum, average) in the application layer by fetching all relevant records into memory creates a significant performance bottleneck in terms of data transfer and memory usage ($O(N)$). Using Prisma's `aggregate` feature allows these calculations to happen natively in the database, returning only the final result.
**Action:** Replace in-memory `reduce` or `forEach` for statistics with Prisma's `aggregate` or `groupBy` functions. Always handle `null` results from empty datasets using nullish coalescing.
