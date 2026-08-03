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

## 2026-07-10 - [Database-level aggregation for user statistics]
**Learning:** Fetching all user progress records into memory to calculate totals and averages (O(N) data transfer and processing) is a performance bottleneck as user history grows. Offloading these calculations to PostgreSQL using Prisma's `aggregate` features (`_sum`, `_avg`) reduces the database response to a single row (O(1)) and significantly lowers memory overhead.
**Action:** When implementing statistics or summary endpoints, always prefer database-level aggregation over in-memory reduction of large datasets.

## 2025-07-09 - [Consolidating statistics with Prisma aggregation]
**Learning:** Statistics endpoints that fetch full record sets to perform in-memory aggregation (e.g., summing stars or averaging metrics) scale poorly as user activity grows (O(N) data transfer and processing). Using Prisma's `aggregate` feature (`_sum`, `_avg`, `_count`) offloads these calculations to the database engine, reducing application-layer complexity to O(1) and minimizing network payload.
**Action:** Always prefer database-level aggregation over fetching multiple records for simple statistical calculations. Avoid adding extra fields like `success: true` to the response unless already part of the API contract.

## 2025-05-26 - Database-level aggregation for user statistics
**Learning:** Fetching all user progress records into memory (`findMany`) to calculate sums or averages in the application layer creates significant memory overhead and high network latency as the user's history grows. Offloading these calculations to the database using Prisma's `aggregate` feature (`_sum`, `_avg`) ensures a constant O(1) payload size and minimal backend processing.
**Action:** Always prefer database-level aggregation over in-memory `reduce` operations for calculating user statistics and historical metrics.

## 2026-07-06 - [Prisma Aggregation for Statistics]
**Learning:** Offloading statistical aggregations (sum, average) to the database using Prisma's `aggregate` function is significantly more efficient than fetching all records and processing them in-memory. This reduces both network overhead and application memory usage, moving the complexity from O(N) to O(1) in the application layer.
**Action:** When implementing or refactoring statistics endpoints, always check if the data can be aggregated at the database level instead of fetching full record sets.

## 2026-07-05 - [Optimizing lesson recommendations with relational filters]
**Learning:** Using a two-step query process (fetching IDs of completed items and then using 'notIn' to find incomplete ones) is a performance anti-pattern. It increases database roundtrips and memory overhead for large datasets. Prisma's relational filters (like 'none') can merge these into a single, efficient database operation.
**Action:** When searching for items that lack a specific relationship or state (like "incomplete lessons"), use relational filters like 'none' or 'some' instead of manual ID-based exclusion.

## 2025-06-15 - [O(L) Skill Tree and Dashboard Derivation]
**Learning:** Complex dashboards requiring skill trees, heatmaps, and historical charts can often be derived from a single, pre-sorted database query (e.g., `prisma.lesson.findMany` with `include: userProgress`). By processing this dataset once (O(L)), we can eliminate redundant queries for historical windows and replace O(L²) prerequisite filtering with O(1) or O(K) index-based lookups in the sorted array.
**Action:** Before adding separate queries for dashboard metrics, check if the data can be derived efficiently from an existing bulk fetch. Use index-based lookups for dependencies in sorted lists.

## 2025-06-03 - In-memory derivation for dashboard visualization
**Learning:** Dashboard endpoints often perform redundant queries to fetch filtered subsets of user data (e.g., last 90 days of WPM, activity heatmaps) that are already present in a broader 'fetch all progress' query. Consolidating these into one joined query and deriving metrics in-memory significantly reduces database roundtrips. Additionally, $O(N^2)$ hierarchical tree construction (like skill trees) can be optimized to $O(N)$ by leveraging the pre-sorted order of database results (e.g., `ORDER BY level, order`) and using index-based preceding-element lookups.
**Action:** Always check if a subset of data can be derived from an existing query result before adding new database calls. Use pre-sorted database ordering to achieve $O(N)$ complexity for sequence-dependent logic.

## 2026-07-02 - [Optimizing Lesson Statistics and Visualization]
**Learning:** Endpoints that fetch multiple subsets of the same table (e.g., historical stats, activity counts, and current progress) can be significantly optimized by fetching the most comprehensive dataset once and deriving subsets in-memory. Consolidating database roundtrips and replacing O(N²) dependency checks with Map-based O(N) lookups improves responsiveness.
**Action:** Before adding new database queries for related metrics, check if the data can be derived from existing parallelized fetches. Use Maps for efficient prerequisite or dependency lookups in complex trees.

## 2025-07-01 - [In-memory derivation and O(N) Skill Tree construction]
**Learning:** For endpoints like `getLearningStats` and `getProgressVisualization`, we can reduce database round-trips by fetching a base dataset (e.g., all lessons with user progress) and deriving metrics like historical activity or completion stats in-memory. Additionally, recursive or nested filtering for skill tree prerequisites can create O(N²) bottlenecks; using Map-based lookups and pre-grouping data by level reduces this to O(N).
**Action:** Before adding new database queries for related metrics, check if the data can be derived from an already-fetched parent dataset. Use Maps for efficient prerequisite lookups.

## 2026-06-29 - [Optimizing skill tree construction and stats aggregation]
**Learning:** O(N²) array operations in controller logic (e.g., nested .map and .find for prerequisites) can be optimized to O(N) using Map-based lookups. Additionally, deriving counts and metrics in-memory from a single comprehensive findMany call is more efficient than performing multiple specialized count/aggregate queries.
**Action:** Use Map-based lookups for relational data derived from flat lists. Consolidate database queries by fetching broader datasets and aggregating in-memory when the cost of data transfer is lower than the latency of multiple roundtrips.

## 2026-06-28 - [In-memory derivation and O(N) tree construction]
**Learning:** Redundant database queries often occur when fetching subsets of data that are already partially or fully contained in a larger, previously fetched dataset (e.g., fetching 90-day history when all-time progress is already retrieved). Additionally, constructing hierarchical structures (like skill trees) using nested array methods leads to O(N²) complexity.
**Action:** Always prefer in-memory filtering/derivation over redundant database calls if the base data is available. Use Maps for O(1) lookups during tree construction to ensure O(N) complexity.

## 2025-06-27 - [Optimizing O(N²) loop in skill tree construction]
**Learning:** Nested array operations like `.filter()`, `.find()`, and `.map()` inside an outer `.map()` loop create a quadratic O(N²) complexity bottleneck. This is especially impactful in data visualization endpoints that process large sets of related records (e.g., lessons and their prerequisites). Using Map-based indexing transforms these operations into O(N) by providing constant-time lookups for related data.
**Action:** Always audit loops that perform sub-lookups on the same or related datasets. Pre-calculate indices or Maps to ensure linear time complexity.
## 2025-06-05 - [In-memory derivation from joined datasets]
**Learning:** For endpoints like progress dashboards that fetch a comprehensive dataset (e.g., all lessons with user progress), subsequent queries for historical windows or activity metrics can be completely eliminated. Deriving these in-memory from the initial dataset is faster than additional database roundtrips, provided the base data is already in memory.
**Action:** Always check if a new database query is redundant given existing datasets in the controller's scope. Prioritize in-memory filtering and mapping over sequential lookups.

## 2025-05-26 - [Consolidating redundant lesson progress queries]
**Learning:** When retrieving full user progress for a feature (like a dashboard or skill tree), secondary queries for historical subsets (e.g., "last 90 days") or aggregated counts (e.g., "total completed") can often be derived in-memory. This eliminates redundant database roundtrips for data that is already present in the initial fetch.
**Action:** Before adding a secondary database query, check if the required data can be filtered or calculated from an existing dataset already fetched in the same request.

## 2026-06-24 - [Prisma Aggregation Consolidation]
**Learning:** Multiple separate database calls for different aggregates (count, sum, max) on the same table with identical filters can be consolidated into a single Prisma `aggregate` call. This reduces the number of database round-trips from N to 1, further lowering latency and database overhead.
**Action:** Always look for opportunities to merge separate `count`, `aggregate`, or `groupBy` calls on the same model and filters into a single consolidated aggregation query.

## 2026-06-23 - Eliminating redundant historical data fetches
**Learning:** Complex visualization endpoints often fetch the same underlying data multiple times (e.g., fetching all lessons with progress AND then fetching lesson history separately). Since progress records often represent a summary of history, derived metrics for heatmaps and progress charts can be computed in-memory from a single comprehensive database fetch. This preserves the API contract while drastically reducing total query count and sequential roundtrips.
**Action:** Before adding a new query for historical analysis, check if the data can be derived from existing parallelized fetches.

## 2026-06-21 - [Parallelizing dashboard metrics fetching]
**Learning:** Sequential database roundtrips for independent data sets (e.g., lessons, history, and activity logs) can be significantly optimized by parallelizing them using `Promise.all`. This reduces the total response time from the sum of all query durations to the duration of the slowest single query.
**Action:** Always identify independent database queries in complex controllers and execute them in parallel using `Promise.all`.
