## 2026-06-02 - Database-level aggregation for user statistics
**Learning:** Fetching an entire history of records to calculate statistics (averages, maximums) in-memory is inefficient and doesn't scale. Using database aggregation (e.g., Prisma's `aggregate`) reduces network traffic and server memory usage from O(N) to O(1).
**Action:** Offload statistical calculations to the database using Prisma's `aggregate` or `groupBy` features. Parallelize these with any other required fetches using `Promise.all`.

## 2025-05-22 - [Optimizing N+1 queries in statistics endpoints]
**Learning:** Statistics endpoints that iterate over categories (like game types) to perform multiple database queries per category (e.g., count, max, average) create a significant performance bottleneck (N+1 query problem). This can be optimized using Prisma's `groupBy` and aggregate features (`_count`, `_max`, `_avg`) to fetch all required data in a single database roundtrip.
**Action:** Always check for loops containing database queries in controller logic. Prefer bulk data retrieval and in-memory mapping over sequential per-category queries.

## 2025-05-10 - Batching upserts in logMistakes
**Learning:** Sequential database roundtrips in a loop (O(n)) can be significantly optimized by aggregating data first and using Prisma transactions. Even when a native 'upsertMany' is missing, grouping by key and batching within a transaction reduces latency.
**Action:** Always look for loops containing database calls and consider if they can be aggregated or batched using `$transaction`.

## 2025-05-24 - Parallelizing bulk metric fetching
**Learning:** When refactoring N+1 queries into bulk fetches, use `Promise.all` to execute independent `count`, `aggregate`, and `findMany` queries in parallel. This minimizes the total response time to the duration of the slowest query rather than the sum of all queries.
**Action:** Always wrap independent bulk data retrieval queries in `Promise.all` when optimizing controllers.

## 2026-06-09 - [Offloading statistical aggregation to Database]
**Learning:** Performing statistical calculations (avg, max, count) in-memory by fetching all raw records is inefficient and risky. It consumes significant memory, increases network payload, and can cause 'Maximum call stack size exceeded' errors when using spread operators on large arrays. Prisma's `aggregate` feature offloads this work to the database engine.
**Action:** Use Prisma's `aggregate` or `groupBy` for statistical metrics instead of fetching all records and calculating them in Node.js.

## 2026-06-07 - [Optimizing user statistics with database-level aggregation]
**Learning:** Fetching all user records into application memory to calculate statistics (like average and max WPM) is a major performance anti-pattern that leads to high memory pressure and latency. Prisma's `aggregate` feature allows offloading these computations to the database, significantly improving efficiency and avoiding potential call stack issues with `Math.max(...)` on large arrays.
**Action:** Use Prisma's `aggregate` (`_avg`, `_max`, `_count`) instead of fetching all records for statistical endpoints. Parallelize aggregation with other related queries using `Promise.all`.

## 2025-05-31 - [Reducing latency by parallelizing independent user metrics queries]
**Learning:** Endpoints that calculate multiple independent user metrics (e.g., total tests, high accuracy tests, lesson completion, best WPM) often execute these queries sequentially using `await`. This results in total latency being the sum of all individual query times. Using `Promise.all` to fetch these metrics in parallel reduces the overall latency to that of the single slowest query.
**Action:** Identify endpoints that perform multiple sequential database counts or single-record lookups and refactor them to use `Promise.all`.

## 2025-05-24 - [Optimizing "top record per category" queries]
**Learning:** Fetching the best record (e.g., high score) for multiple categories in a loop creates an N+1 query problem. This can be optimized in Prisma/PostgreSQL using `findMany` with the `distinct` property. When using `distinct: ['category']`, the `orderBy` must start with `category` followed by the sorting criteria (e.g., `score: 'desc'`) to ensure the correct record is picked for each distinct value in a single roundtrip.
**Action:** Use `distinct` + `orderBy` to resolve N+1 patterns when fetching the "best" or "latest" record per category.

## 2025-05-29 - [Optimizing "Top Record Per Category" N+1 queries]
**Learning:** Fetching the single best record across multiple categories (e.g., high scores per game type) often leads to N+1 query patterns. This can be optimized into a single database roundtrip using `prisma.model.findMany` with the `distinct` property on the category field, combined with an appropriate `orderBy` (e.g., `score: 'desc'`.
**Action:** When you need the "winning" record for each group, use `findMany({ distinct: ['field'], orderBy: [...] })` instead of looping `findFirst`.
