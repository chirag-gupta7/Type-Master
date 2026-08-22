## 2026-08-09 - Parallelizing onboarding flow database queries in Skill Assessment controller
**Learning:** Placement tests or onboarding flows that sequentially store assessment results and fetch recommended starting content block on sequential database roundtrips. When these read and write queries are independent and rely on pre-calculated in-memory variables, they can be wrapped in `Promise.all` to execute concurrently, reducing latency by up to 50%.
**Action:** When working on multi-step onboarding/placement endpoints, group and run independent queries in parallel using `Promise.all` instead of sequentially awaiting them.

## 2026-08-08 - Parallelizing User Validation and Resource Fetching in startAssessment
**Learning:** Initializing/starting flow endpoints frequently perform sequential checks: verifying the authenticated user exists first, then fetching the initial lesson or assessment template content. Combining these completely independent queries inside `Promise.all` executes them concurrently, minimizing API response latency down to the maximum single query execution time instead of their sum.
**Action:** Inspect initialization and bootstrap handlers for sequential validation and configuration database lookups, and execute them concurrently via `Promise.all`.

## 2026-07-31 - Parallelizing weak key analysis queries
**Learning:** Sequential await execution of multiple independent database queries (e.g., findMany, queryRaw) in controller endpoints introduces unnecessary cumulative network and DB roundtrip latencies. Using Promise.all parallelizes execution, reducing total API response time to that of the single slowest query.
**Action:** Identify endpoints that perform separate, non-dependent database operations and wrap them using Promise.all.

## 2026-07-30 - Parallelizing Independent Database Queries in getWeakKeyAnalysis
**Learning:** Sequential await operations on multiple independent database queries (such as findMany and $queryRaw) cause latency to be the sum of all individual query times. Using Promise.all executes these queries concurrently, dropping the response latency down to that of the slowest single query.
**Action:** Always inspect controllers for multiple independent await statements on Prisma queries and wrap them in Promise.all to achieve concurrency.

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

## 2025-05-25 - [WPMProgressChart.tsx]

**Bottleneck/Context:** Array maps within chart renders recalculate expensive derived states on every render. Finding a specific point inside a nested array via `.find()` within an iteration makes the operation O(N²) or O(N³), causing severe UI lag when filtering datasets or typing fast.
**Failed Attempt/Lesson:** N/A (Direct fix identified).
**Action Pattern:** Always memoize derived arrays for charting components using `useMemo` and replace `.find()` inside mapping loops with pre-computed `Map` or `Set` lookups to reduce algorithmic complexity to O(N).

## 2026-07-25 - Concurrency in Weak Key Analysis
**Learning:** Fetching separate kinds of analysis data (e.g., user weak keys, raw finger error queries, and recent typing mistakes) sequentially can introduce substantial network and query latency. Wrapping these independent queries inside a single `Promise.all` allows them to execute concurrently, lowering the overall request duration from the sum of the queries to the single slowest one.
**Action:** Ensure that independent retrieval queries are bundled via `Promise.all` inside controllers to achieve maximum concurrency.

## 2026-07-24 - Parallelizing sequential database requests in getWeakKeyAnalysis
**Learning:** Retrieving metrics sequentially for a single analysis (e.g., fetching user's weak keys, raw SQL finger errors, and recent mistakes consecutively) introduces unnecessary database roundtrip latency bottlenecks (O(3 * T_query)). Combining distinct, independent database queries using Promise.all parallelizes their execution and reduces response time to the single slowest query (O(max(T_query_1, T_query_2, T_query_3))).
**Action:** Look for independent sequential query chains inside endpoints and wrap them in Promise.all for concurrent resolution.

## 2026-07-22 - Parallelizing user-specific weak key analysis queries
**Learning:** Endpoints that analyze user activity patterns often fetch multiple unrelated datasets sequentially (e.g., weak keys, finger-specific raw errors, and recent mistakes). This blocks execution on each query consecutively. Wrapping these queries in `Promise.all` parallelizes the database workload, dramatically reducing endpoint response latency to the time of the slowest single query.
**Action:** Identify independent queries in user statistics or analysis endpoints and parallelize them via `Promise.all`.

## 2026-07-21 - [Optimizing array traversals in skill tree structures]
**Learning:** In-memory hierarchical structure building (like a skill tree with prerequisites) can easily degrade to O(N^2) complexity if nodes perform nested .filter() and .find() scans on the full dataset. Utilizing precomputed Maps for level indexing and Sets for status verification reduces the lookup overhead to O(1) per node.
**Action:** When building nested array mappings or dependency trees in memory, pre-structure the dataset into quick-lookup Map and Set collections instead of performing linear searches.

## 2026-07-20 - Database-level Leaderboard Deduplication
**Learning:** In-memory deduplication of leaderboard query results fetched via simple `findMany` limits (e.g., `take: 100`) is both a performance risk and a correctness bug. If a subset of active users hold multiple top scores, they push out other unique users, resulting in less than the requested limit being displayed. Offloading grouping and sorting to the database via `groupBy` on `userId` first ensures exact and complete unique user results, while a subsequent batched `findMany` query with `OR` fetches full details efficiently.
**Action:** Avoid raw limit-and-filter patterns for leaderboards. Always use a two-stage `groupBy` and batched `findMany` details query to guarantee correct leaderboard sizes and optimal database indexing.

## 2026-07-19 - [O(L) Skill Tree Construction via Pre-sorted Indices]
**Learning:** Complex tree/dependency structures built from in-memory arrays can suffer from O(L^2) bottlenecks if prerequisite resolution performs linear scans (`.filter`, `.find`) for every element. When the dataset is pre-sorted (such as by level and order), prerequisites can be resolved in O(1) constant time via index-based offsets, and verification of lock states can be speed up from O(L) to O(1) by using a pre-computed Set of completed elements.
**Action:** Always leverage the pre-sorted order of retrieved database arrays to perform index-offset lookups instead of sequential nested searches. Use Set and Map lookups to keep state validation constant-time.

## 2026-07-17 - O(L) Index-Based Lookups for Pre-Sorted Lists

**Learning:** Building dependency and skill trees from sorted flat lists (like lessons sorted by level/order) can suffer from O(L^2) overhead if we filter the entire list to locate parents or prerequisites. When the database already guarantees a sorted order (e.g., level asc, order asc), relative parent nodes are at deterministic relative index offsets (e.g., `index - 1`).
**Action:** Leverage index offsets and pre-computed hash sets for O(1) membership queries to construct flat trees in strict O(L) time.

## 2025-05-26 - [Database-level aggregation for statistics]
**Learning:** Calculating statistics (stars, WPM, accuracy) in-memory using `.reduce()` after a `findMany` call can be extremely inefficient as the dataset grows (O(N) data transfer and processing). Using Prisma's `aggregate` feature (`_sum`, `_avg`, `_count`) moves this logic to the database, resulting in O(1) data transfer and significantly lower memory footprint on the backend.
**Action:** Always prefer database-level aggregation for calculating metrics over large datasets instead of fetching and processing in-memory.

## 2025-05-26 - [Environment-specific npx versioning]
**Learning:** Using `npx` without a version specifier can pull the latest major version (e.g., Prisma v7.x), which may introduce breaking changes or validation errors (like datasource URL support) not compatible with the project's current configuration (v6.x).
**Action:** Always use the pinned version from `package.json` (e.g., `npx prisma@6.19.0`) when running CLI tools in the sandbox to maintain environment consistency and avoid accidental lockfile modifications.

## 2026-07-14 - [In-memory vs Database Aggregation]
**Learning:** Fetching all user records to perform statistics (sum, average) in the application layer creates O(N) memory pressure and CPU overhead. Prisma's `aggregate` feature allows offloading these calculations to the database, resulting in O(1) response payloads and significantly lower backend resource usage.
**Action:** Replace `findMany` followed by `.reduce()` with `aggregate` when calculating totals or averages across a user's entire history.

## 2026-07-13 - [Offloading statistical aggregation to Database]
**Learning:** Performing statistical calculations (sum, average) in application memory using `.reduce()` on large datasets retrieved from the database creates O(N) memory and processing overhead. Offloading these to Prisma's `.aggregate()` function reduces complexity to O(1) at the application level and minimizes network payload size.
**Action:** Replace in-memory aggregations of database results with native SQL aggregation functions via Prisma's `aggregate` or `groupBy` features.

## 2025-06-12 - [Consolidating multi-step relational queries]
**Learning:** Multi-step database operations that first fetch IDs and then filter by them (e.g., using `notIn`) can be consolidated into a single query using Prisma's relational filters like `none`. This reduces database roundtrips and application memory overhead.
**Action:** Look for patterns where `findMany` is followed by another query using those results, and try to use relational filters instead.

## 2026-07-10 - [Database-level aggregation for user statistics]
**Learning:** Fetching all user progress records into memory to calculate totals and averages (O(N) data transfer and processing) is a performance bottleneck as user history grows. Offloading these calculations to PostgreSQL using Prisma's `aggregate` features (`_sum`, `_avg`) reduces the database response to a single row (O(1)) and significantly lowers memory overhead.
**Action:** When implementing or refactoring statistics or summary endpoints, always prefer database-level aggregation over in-memory reduction of large datasets.

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

## 2026-08-01 - Parallelizing weak key analysis fetches
**Learning:** The `getWeakKeyAnalysis` endpoint was executing three independent database queries (finding user weak keys, querying finger error patterns via `$queryRaw`, and retrieving recent typing mistakes) sequentially. This sequentially blocks the Node event loop and accumulates latency. Parallelizing these queries using `Promise.all` reduces latency to the duration of the single slowest query.
**Action:** Execute independent read operations concurrently via `Promise.all` to optimize backend endpoint performance.

## 2026-08-04 - [Optimizing Interactive Keyboard Component Rendering]
**Learning:** Interactive UI elements responding to frequent, high-frequency events (e.g., keypresses in typing interfaces) suffer major visual latency if the entire layout (e.g., ~60 visual keys) re-renders completely on every stroke. Moving state checks and key-normalization (`useMemo`) to the parent container and wrapping individual keys in `React.memo` reduces rendering complexity from O(Keys) to O(1), preventing main-thread blocking and frame drops.
**Action:** For visual grids, keyboards, or high-frequency listings, always extract children into memoized components, pass simple state indicators as props, and perform normalization outside of the child render loop.

## 2026-08-07 - React Virtual Keyboard Keystroke Rendering Optimization
**Learning:** Under high-frequency keystroke events, re-rendering an entire virtual keyboard with ~60 key nodes creates a notable performance bottleneck. Extracting the individual key node into a memoized subcomponent (`KeyboardKey`) and pre-normalizing comparison keys (like `targetKey` and `pressedKey`) in the parent component reduces rendering overhead from O(Keys) to O(1) per keystroke, guaranteeing steady 60fps responsiveness during typing tests.
**Action:** For interactive grid or layout structures undergoing rapid state updates (like visual keyboards, dashboards, or spreadsheets), isolate individual cells/keys into memoized child components and lift heavy state normalization logic to the parent.
