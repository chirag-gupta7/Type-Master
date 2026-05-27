## 2025-05-22 - [Optimizing N+1 queries in statistics endpoints]
**Learning:** Statistics endpoints that iterate over categories (like game types) to perform multiple database queries per category (e.g., count, max, average) create a significant performance bottleneck (N+1 query problem). This can be optimized using Prisma's `groupBy` and aggregate features (`_count`, `_max`, `_avg`) to fetch all required data in a single database roundtrip.
**Action:** Always check for loops containing database queries in controller logic. Prefer bulk data retrieval and in-memory mapping over sequential per-category queries.

## 2025-05-10 - Batching upserts in logMistakes
**Learning:** Sequential database roundtrips in a loop (O(n)) can be significantly optimized by aggregating data first and using Prisma transactions. Even when a native 'upsertMany' is missing, grouping by key and batching within a transaction reduces latency.
**Action:** Always look for loops containing database calls and consider if they can be aggregated or batched using `$transaction`.

## 2025-05-24 - Offloading statistics to the database
**Learning:** Fetching all database records into application memory to calculate averages or maximums is a significant bottleneck. Prisma's `aggregate` feature allows these calculations to be performed directly by the database engine, reducing memory overhead and network payload size from O(N) to O(1).
**Action:** Replace `findMany` calls used solely for summary statistics with `aggregate` or `groupBy`. Always use `Promise.all` to fetch these stats in parallel with any other required data (like recent records).
