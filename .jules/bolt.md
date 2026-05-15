## 2025-05-22 - [Optimizing N+1 queries in statistics endpoints]
**Learning:** Statistics endpoints that iterate over categories (like game types) to perform multiple database queries per category (e.g., count, max, average) create a significant performance bottleneck (N+1 query problem). This can be optimized using Prisma's `groupBy` and aggregate features (`_count`, `_max`, `_avg`) to fetch all required data in a single database roundtrip.
**Action:** Always check for loops containing database queries in controller logic. Prefer bulk data retrieval and in-memory mapping over sequential per-category queries.

## 2025-05-10 - Batching upserts in logMistakes
**Learning:** Sequential database roundtrips in a loop (O(n)) can be significantly optimized by aggregating data first and using Prisma transactions. Even when a native 'upsertMany' is missing, grouping by key and batching within a transaction reduces latency.
**Action:** Always look for loops containing database calls and consider if they can be aggregated or batched using `$transaction`.

## 2026-05-15 - [Efficient 'Top-Per-Category' Queries with Prisma]
**Learning:** To retrieve the highest score per game type in a single query (avoiding N+1), use Prisma's `distinct` property. Crucially, the field being made distinct must be the first field in the `orderBy` clause (e.g., `orderBy: [{ gameType: 'asc' }, { score: 'desc' }]`) for the database (like PostgreSQL) to correctly identify the top record for each distinct group.
**Action:** When implementing 'best of' or 'latest per category' features, use the `distinct` + `orderBy` pattern instead of multiple `findFirst` queries in a loop.
