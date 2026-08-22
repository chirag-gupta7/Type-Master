# Graph Report - typemaster  (2026-08-22)

## Corpus Check
- 187 files · ~107,934 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1222 nodes · 1810 edges · 140 communities (82 shown, 58 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.85)
- Token cost: 38,500 input · 18,500 output

## Community Hubs (Navigation)
- Frontend Game Clients
- Documentation and Audit
- Root Scripts and Deps
- Backend Dev Tooling
- Workspace Monorepo Config
- Backend TS Config
- Lesson Controller API
- Frontend TS Config
- Auth Session and API Base
- Tests TS Config
- Typing Test Core
- Results and Toast UI
- ESLint Config Root
- ESLint Config Backend
- Auth Rate Limiting
- Achievement UI Context
- Hand Position Guide 3D
- Shared Buttons Guards
- App Bootstrap Auth Tests
- Middleware and Logger
- Achievements Page UI
- Prisma Migrations
- Lesson Typing Interface
- Shared Type Definitions
- Database Seed Scripts
- Visual Keyboard Components
- Lesson Practice Pages
- UI Card Toast Primitives
- Feature Catalog Concepts
- Learn Page Content
- AI Gemini Proxy Controller
- Game Scores Leaderboards
- Prisma Client Test API
- Theme System Landing
- Changelog v2 Concepts
- App Layout Providers
- Achievement Award Logic
- Documentation Hub Index
- Frontend Testing Libs
- Progress Dashboard Charts
- Navbar.tsx
- schema.prisma
- mistake.controller.ts
- PracticeHeatMap.tsx
- assessment.controller.ts
- scripts
- enhanced-page.tsx
- sections-page.tsx
- seed-new-lessons.ts
- FeatureCards.tsx
- INTERNAL_API_SECRET Shared Secret
- dependencies
- AchievementNotificationToast.tsx
- CircularProgressChart.tsx
- CODEBASE_AUDIT.md
- SkillTreeVisualization.tsx
- useAchievements.ts
- next-auth.d.ts
- Vercel/Render Deployment Flow
- Start Typing Test Flow
- Local Setup Workflow
- Database-Level Aggregation via Prisma
- Tooltips for Icon-Only Buttons
- jest.config.js
- package.json
- page.tsx
- LoginForm.tsx
- not-found.tsx
- Achievements Feature
- opencode.json
- In-Memory Derivation from a
- ProtectedRoute.tsx
- graphify.js
- opencode-dev Job
- React.memo Keyboard Key Rendering
- Credential Stuffing via Composite
- next.config.js
- next-env.d.ts
- class-variance-authority
- clsx
- framer-motion
- lucide-react
- next-auth
- @next-auth/prisma-adapter
- next-themes
- @prisma/client
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-navigation-menu
- @radix-ui/react-slot
- @radix-ui/react-toast
- @radix-ui/react-tooltip
- random-words
- react
- react-confetti
- recharts
- tailwind-merge
- tailwindcss-animate
- @tanstack/react-query
- zod
- zustand
- eslint
- eslint-config-next
- eslint-config-prettier
- jest
- jest-environment-jsdom
- prisma
- tailwindcss
- @testing-library/user-event
- @types/bcryptjs
- @types/react
- @types/react-dom
- typescript
- @typescript-eslint/eslint-plugin
- @typescript-eslint/parser
- tailwind.config.ts
- Frontend NextAuth Config (authOptions.ts)
- Learn Path Flow
- App-Level UI Shell
- Pinned CLI Versioning for
- Skip to Content Link
- Overly Permissive CORS Wildcard
- apps/frontend/src/lib/api.ts
- Conventional Commit Format type(scope):
- Global Keyboard Shortcuts Hook
- ResultsScreen Component
- Text Generator (generateTestText, 580+

## God Nodes (most connected - your core abstractions)
1. `cn()` - 51 edges
2. `compilerOptions` - 25 edges
3. `Button` - 24 edges
4. `compilerOptions` - 22 edges
5. `compilerOptions` - 20 edges
6. `prisma` - 17 edges
7. `scripts` - 15 edges
8. `scripts` - 13 edges
9. `logger` - 13 edges
10. `TypeMaster Documentation Hub` - 12 edges

## Surprising Connections (you probably didn't know these)
- `PostgreSQL Service (postgres:15-alpine)` --semantically_similar_to--> `Postgres Test Service Container in CI`  [INFERRED] [semantically similar]
  docker-compose.yml → .github/workflows/ci.yml
- `Client-Side AI Key Exposure Vulnerability` --semantically_similar_to--> `Client-Side Gemini API Key Consumption Risk`  [INFERRED] [semantically similar]
  .Jules/sentinel.md → docs/CODEBASE_AUDIT.md
- `Zod Schema Validation Library` --semantically_similar_to--> `API Controller Structure with Zod Validation Schema`  [INFERRED] [semantically similar]
  .Jules/sentinel.md → CONTRIBUTING.md
- `Games Backend API (/api/v1/games/*)` --semantically_similar_to--> `Games Router Endpoints (/games)`  [INFERRED] [semantically similar]
  CONTRIBUTING.md → docs/API.md
- `Backend App (apps/backend, Express + Prisma)` --shares_data_with--> `PostgreSQL Service (postgres:15-alpine)`  [INFERRED]
  README.md → docker-compose.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **AI Proxy Security Hardening** — _jules_sentinel_backend_ai_proxy_pattern, _jules_sentinel_zod_validation_library, _jules_sentinel_prompt_injection_risk, _jules_sentinel_client_side_ai_key_exposure [EXTRACTED 1.00]
- **NextAuth to Backend JWT Bridge Security** — docs_auth_setup_guide_dual_auth_model, docs_auth_setup_guide_token_provisioning_flow, _jules_sentinel_auth_token_endpoint_bypass, _jules_sentinel_internal_api_secret [EXTRACTED 1.00]
- **Database and Query Performance Optimization Patterns** — _jules_bolt_promise_all_parallelization, _jules_bolt_database_level_aggregation, _jules_bolt_skill_tree_o_n_construction, _jules_bolt_in_memory_derivation [EXTRACTED 1.00]
- **TypeMaster Implemented Feature Set** — docs_features_typing_test, docs_features_learning_system, docs_features_games, docs_features_achievements, docs_features_progress_history, docs_features_authentication [EXTRACTED 1.00]
- **NextAuth-to-Backend-JWT Auth Integration Stack** — docs_features_authentication, docs_project_overview_architecture, docs_development_phases_phase_c_auth_integration, apps_frontend_src_lib_api_ts [INFERRED 0.85]
- **Vercel-to-Render Frontend/Backend Deployment Topology** — docs_project_overview_deployment_flow, docs_readme_live_deployment, docs_organization_summary_deployment_layout, apps_frontend_next_config_js [INFERRED 0.85]

## Communities (140 total, 58 thin omitted)

### Community 0 - "Frontend Game Clients"
Cohesion: 0.06
Nodes (43): GAMES, GamesClient(), PromptDash, StoryChain, WordBlitz, FALLBACK_PROMPTS, PromptDash(), FALLBACK_RESPONSES (+35 more)

### Community 1 - "Documentation and Audit"
Cohesion: 0.04
Nodes (49): build-backend CI Job, build-frontend CI Job, CI/CD Pipeline Workflow, Codecov Coverage Upload Step, Postgres Test Service Container in CI, test-backend CI Job, test-frontend CI Job, Server-Side Backend Proxy Pattern for AI Services (+41 more)

### Community 2 - "Root Scripts and Deps"
Cohesion: 0.05
Nodes (41): dependencies, bcrypt, cors, dotenv, express, express-rate-limit, helmet, jsonwebtoken (+33 more)

### Community 3 - "Backend Dev Tooling"
Cohesion: 0.05
Nodes (39): devDependencies, eslint, eslint-config-prettier, jest, prisma, supertest, ts-jest, ts-node (+31 more)

### Community 4 - "Workspace Monorepo Config"
Cohesion: 0.05
Nodes (37): concurrently, description, devDependencies, concurrently, prettier, stylelint-config-tailwindcss, @types/node, typescript (+29 more)

### Community 5 - "Backend TS Config"
Cohesion: 0.06
Nodes (32): compilerOptions, allowJs, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx (+24 more)

### Community 6 - "Lesson Controller API"
Cohesion: 0.12
Nodes (28): AuthRequest, buildLessonsWithUnlockState(), getAllLessons(), getCheckpointLessons(), getFairPageBounds(), getLearningDashboard(), getLearningStats(), getLessonById() (+20 more)

### Community 7 - "Frontend TS Config"
Cohesion: 0.06
Nodes (31): coverage, .next, compilerOptions, allowJs, checkJs, declaration, declarationMap, esModuleInterop (+23 more)

### Community 8 - "Auth Session and API Base"
Cohesion: 0.11
Nodes (22): handler, AssessmentPage(), AssessmentResult, RecommendedLesson, SessionUserWithId, API_VERSION, getApiBaseUrl(), API_BASE_URL (+14 more)

### Community 9 - "Tests TS Config"
Cohesion: 0.07
Nodes (27): compilerOptions, allowSyntheticDefaultImports, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+19 more)

### Community 10 - "Typing Test Core"
Cohesion: 0.11
Nodes (19): DashboardPage(), TestHistory, UserStats, TypingTest(), Word, generateTestText(), getRandomSentence(), getTargetWordCount() (+11 more)

### Community 11 - "Results and Toast UI"
Cohesion: 0.10
Nodes (24): MistakeAnalysis(), MistakeAnalysisProps, WeakKey, MistakeDetail, ResultsScreen(), ResultsScreenProps, StatBox(), ToastActionElement (+16 more)

### Community 12 - "ESLint Config Root"
Cohesion: 0.08
Nodes (24): env, es2022, node, extends, eslint:recommended, plugin:@typescript-eslint/recommended, prettier, @typescript-eslint (+16 more)

### Community 13 - "ESLint Config Backend"
Cohesion: 0.09
Nodes (23): env, es2022, node, extends, eslint:recommended, plugin:@typescript-eslint/recommended, prettier, @typescript-eslint (+15 more)

### Community 14 - "Auth Rate Limiting"
Cohesion: 0.17
Nodes (18): ensureUniqueUsername(), findOrCreateUserForToken(), generateAccessToken(), generateRefreshToken(), getTokenForNextAuthUser(), login(), loginSchema, normalizeUsernameSeed() (+10 more)

### Community 15 - "Achievement UI Context"
Cohesion: 0.11
Nodes (17): Milestone, TestAchievementsContent(), Achievement, AchievementToast(), AchievementToastProps, Achievement, AchievementUnlockModal(), AchievementUnlockModalProps (+9 more)

### Community 16 - "Hand Position Guide 3D"
Cohesion: 0.12
Nodes (17): DEMO_KEYS, HandPositionDemo(), HOME_ROW_KEYS, HandModel3D(), HandModel3DProps, AnimatedArrow(), AnimatedArrowProps, FINGER_COLORS (+9 more)

### Community 17 - "Shared Buttons Guards"
Cohesion: 0.13
Nodes (11): HistoryPage(), TestResult, SettingsContent(), AuthGuardProps, MilestoneCelebration(), MilestoneCelebrationProps, Button, ButtonProps (+3 more)

### Community 18 - "App Bootstrap Auth Tests"
Cohesion: 0.16
Nodes (13): createTestApp(), createTestApp(), allowedOrigins, app, errorHandler(), router, router, router (+5 more)

### Community 19 - "Middleware and Logger"
Cohesion: 0.20
Nodes (11): getProfile(), updateProfile(), updateProfileSchema, express-serve-static-core, internalOnly(), JWTPayload, Request, AppError (+3 more)

### Community 20 - "Achievements Page UI"
Cohesion: 0.17
Nodes (15): AchievementsPage(), ACHIEVEMENT_ICONS, AchievementCard(), AchievementCardProps, AchievementCardSkeleton(), AchievementGrid(), AchievementIcon, AchievementUnlockAnimation() (+7 more)

### Community 21 - "Prisma Migrations"
Cohesion: 0.18
Nodes (13): "test_results", "users", "achievements", "lessons", "user_achievements", "user_lesson_progress", "accounts", "game_scores" (+5 more)

### Community 22 - "Lesson Typing Interface"
Cohesion: 0.15
Nodes (14): fetchLesson(), Confetti, Lesson, LessonTypingInterface(), LessonTypingInterfaceProps, NOTE: ambient module declarations must live in a .d.ts file (e.g.…, ReactConfettiProps, DEFAULT_PROGRESS (+6 more)

### Community 23 - "Shared Type Definitions"
Cohesion: 0.12
Nodes (16): AchievementIcon, ApiResponse, AuthResponse, CreateTestResultRequest, DashboardStats, LoginRequest, PaginatedResponse, RegisterRequest (+8 more)

### Community 24 - "Database Seed Scripts"
Cohesion: 0.18
Nodes (11): section1Lessons, section2Lessons, section3Lessons, achievements, allLessons, codingLessons, prisma, allLessons (+3 more)

### Community 25 - "Visual Keyboard Components"
Cohesion: 0.17
Nodes (13): DEMO_PHRASES, KeyboardDemoPage(), AnimatedHandOverlay(), AnimatedHandOverlayProps, FINGER_ZONES, getFingerZone(), HandPositionGuide(), KEYBOARD_LAYOUT (+5 more)

### Community 26 - "Lesson Practice Pages"
Cohesion: 0.17
Nodes (10): getFingerForKey(), Lesson, LessonPracticePage(), TypingMistake, UserStats, WeakKeyAnalysis, useAchievementChecker(), FALLBACK_LESSONS (+2 more)

### Community 27 - "UI Card Toast Primitives"
Cohesion: 0.27
Nodes (13): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Toast, ToastAction (+5 more)

### Community 28 - "Feature Catalog Concepts"
Cohesion: 0.23
Nodes (16): Phase A - Core Platform, Phase B - Learning + Gamification, Phase C - Auth Integration, Authentication Feature, Feature Inventory, Games Feature, Games and Leaderboards Flow, Progress Analytics Flow (+8 more)

### Community 29 - "Learn Page Content"
Cohesion: 0.20
Nodes (12): getLessonSummaryText(), getSectionPageKey(), LearnPageContent(), LessonProgress, parsePage(), parsePositiveInt(), parsePracticeType(), PracticeType (+4 more)

### Community 30 - "AI Gemini Proxy Controller"
Cohesion: 0.29
Nodes (11): callGemini(), extractGeminiText(), GeminiResponse, generateWritingPrompt(), getStoryResponse(), getTypingFeedback(), getWritingFeedback(), storyResponseSchema (+3 more)

### Community 31 - "Game Scores Leaderboards"
Cohesion: 0.30
Nodes (11): AuthRequest, GameScorePayload, getGameStats(), getLeaderboard(), getUserGameHistory(), getUserHighScores(), parseGameType(), parseMetadata() (+3 more)

### Community 32 - "Prisma Client Test API"
Cohesion: 0.23
Nodes (9): AuthRequest, createTestResult(), createTestResultSchema, getTestById(), getUserStats(), getUserTests(), authenticate(), router (+1 more)

### Community 33 - "Theme System Landing"
Cohesion: 0.26
Nodes (7): LandingHero(), ThemeApplicator(), TooltipContent, THEME_PRESETS, ThemeColors, ThemeState, useThemeStore

### Community 34 - "Changelog v2 Concepts"
Cohesion: 0.17
Nodes (13): getWeakKeyAnalysis Endpoint, Promise.all Parallelization of Independent DB Queries, startAssessment Endpoint, Achievement Celebration Components v2 (UnlockModal, Toast, MilestoneCelebration), Placement Test Flow (/learn/assessment), react-confetti Dependency (^6.1.0), TypingMistake Model, UserSkillAssessment Model (+5 more)

### Community 35 - "App Layout Providers"
Cohesion: 0.21
Nodes (8): inter, metadata, viewport, PageLoadingIndicator(), Providers(), ThemeSelector(), UiState, useUiStore

### Community 36 - "Achievement Award Logic"
Cohesion: 0.30
Nodes (9): AuthRequest, checkAchievementRequirements, checkAndAwardAchievements(), fetchUserMetrics(), getAchievementProgress(), getAchievementStats(), getAllAchievements(), UserMetrics (+1 more)

### Community 37 - "Documentation Hub Index"
Cohesion: 0.26
Nodes (12): ACHIEVEMENT_SYSTEM.md, API.md, AUTH_QUICK_REFERENCE.md, AUTH_SETUP_GUIDE.md, FILE_STRUCTURE.md, IMPLEMENTATION.md, Project Documentation Map, PROJECT_OVERVIEW.md (+4 more)

### Community 38 - "Frontend Testing Libs"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, postcss, @testing-library/jest-dom, @testing-library/react, @types/node, @types/node, autoprefixer (+3 more)

### Community 39 - "Progress Dashboard Charts"
Cohesion: 0.24
Nodes (6): LearningProgressDashboard(), LESSON_COLORS, WPMProgressChart(), WPMProgressChartProps, LessonWPMData, ProgressVisualizationData

### Community 40 - "Navbar.tsx"
Cohesion: 0.27
Nodes (9): Navbar(), navLinks, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle (+1 more)

### Community 41 - "schema.prisma"
Cohesion: 0.22
Nodes (10): schema.prisma, apps/backend/src/index.ts, Backend Source Structure, Frontend Source Structure, Monorepo Layout, Prisma Data Layer Coverage, Repository Layout, Runtime Layout (+2 more)

### Community 42 - "mistake.controller.ts"
Cohesion: 0.38
Nodes (7): AuthRequest, generatePracticeContent(), generatePracticeText(), generateWeakKeyAnalysis(), getWeakKeyAnalysis(), logMistakes(), logMistakeSchema

### Community 43 - "PracticeHeatMap.tsx"
Cohesion: 0.36
Nodes (9): calculateCurrentStreak(), calculateLongestStreak(), getColorIntensity(), getLast365Days(), getMonthLabels(), getTooltipText(), PracticeHeatMap(), PracticeHeatMapProps (+1 more)

### Community 44 - "assessment.controller.ts"
Cohesion: 0.39
Nodes (6): completeAssessment(), completeAssessmentSchema, generateFeedback(), getLatestAssessment(), startAssessment(), startAssessmentSchema

### Community 45 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, postinstall, start, test, test:ci (+1 more)

### Community 46 - "enhanced-page.tsx"
Cohesion: 0.25
Nodes (6): EnhancedLessonPage(), getFingerForKey(), Lesson, TypingMistake, WeakKeyAnalysis, mistakeAPI

### Community 47 - "sections-page.tsx"
Cohesion: 0.28
Nodes (8): getSectionInfo(), LearnPage(), fetchLessons(), Lesson, SECTION_INFO, SectionData, SectionInfo, lessonAPI

### Community 48 - "seed-new-lessons.ts"
Cohesion: 0.25
Nodes (6): advancedPunctuationLessons, codeSyntaxLessons, commonFingers, newLessons, prisma, speedDrillLessons

### Community 49 - "FeatureCards.tsx"
Cohesion: 0.29
Nodes (5): container, FeatureCard, FeatureCards(), FEATURES, item

### Community 50 - "INTERNAL_API_SECRET Shared Secret"
Cohesion: 0.33
Nodes (7): /api/v1/auth/token Unauthenticated Provisioning Vulnerability, INTERNAL_API_SECRET Shared Secret, internalOnly Middleware, Secret Length Timing Leak in timingSafeEqual Usage, Planned NextAuth Integration (v2.1.0), Dual Auth Model (NextAuth Session + Backend JWT), Token Provisioning via POST /api/v1/auth/token

### Community 51 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, bcryptjs, next, react-dom, next, bcryptjs, react-dom

### Community 52 - "AchievementNotificationToast.tsx"
Cohesion: 0.29
Nodes (5): ACHIEVEMENT_ICONS, AchievementNotification, AchievementNotificationContainerProps, AchievementNotificationToast(), AchievementNotificationToastProps

### Community 53 - "CircularProgressChart.tsx"
Cohesion: 0.33
Nodes (4): CircularProgressChart(), CircularProgressChartProps, COLORS, LevelCompletion

### Community 54 - "CODEBASE_AUDIT.md"
Cohesion: 0.29
Nodes (7): CODEBASE_AUDIT.md, Phase D - Hardening, Documentation Reorganization, Documentation Update Policy, Backend Bootstrap Middleware Stack, Security Posture Notes, Client-side Debug Logging Observation

### Community 55 - "SkillTreeVisualization.tsx"
Cohesion: 0.53
Nodes (5): getDifficultyColor(), getLevelName(), SkillTreeVisualization(), SkillTreeVisualizationProps, SkillTreeNode

### Community 56 - "useAchievements.ts"
Cohesion: 0.40
Nodes (5): achievementAPI, AchievementNotification, AchievementProgress, useAchievementNotifications(), useAchievementTracker()

### Community 57 - "next-auth.d.ts"
Cohesion: 0.33
Nodes (5): JWT, next-auth, next-auth/jwt, Session, User

### Community 58 - "Vercel/Render Deployment Flow"
Cohesion: 0.40
Nodes (5): apps/frontend/next.config.js, Deployment Layout, Vercel/Render Deployment Flow, Live Deployment Endpoints, Build Strictness Caveat

### Community 59 - "Start Typing Test Flow"
Cohesion: 0.40
Nodes (5): TypingTest.tsx Component, Start Typing Test Flow, testAPI.saveTestResult, Gemini Client-Side Key Exposure Risk, Modern Typing Test Implementation

### Community 60 - "Local Setup Workflow"
Cohesion: 0.40
Nodes (5): Database Preparation Commands, Environment Variable Configuration, Local Setup Workflow, Post-Setup Validation Commands, Workspace Test Commands

### Community 61 - "Database-Level Aggregation via Prisma"
Cohesion: 0.50
Nodes (4): Database-Level Aggregation via Prisma aggregate/groupBy, Database-Level Leaderboard Deduplication via groupBy, N+1 Query Problem, Batching Upserts with $transaction in logMistakes

### Community 62 - "Tooltips for Icon-Only Buttons"
Cohesion: 0.50
Nodes (4): aria-label Accessibility for Icon Buttons, Tooltips for Icon-Only Buttons, Radix UI Tooltip with asChild Trigger, Dynamic Theme System (Zustand useThemeStore, 10 presets)

### Community 63 - "jest.config.js"
Cohesion: 0.50
Nodes (3): createJestConfig, customJestConfig, nextJest

### Community 64 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 65 - "page.tsx"
Cohesion: 0.67
Nodes (3): getRankIcon(), LeaderboardPage(), MOCK_LEADERBOARD

### Community 68 - "Achievements Feature"
Cohesion: 0.50
Nodes (4): Achievement Model, Achievements Feature, POST /achievements/check Route, UserAchievement Model

### Community 70 - "opencode.json"
Cohesion: 0.50
Nodes (3): plugin, $schema, .opencode/plugins/graphify.js

### Community 71 - "In-Memory Derivation from a"
Cohesion: 0.67
Nodes (3): In-Memory Derivation from a Single Comprehensive Fetch, Prisma Relational Filters Consolidation ('none'/'some'), O(L) Skill Tree Construction via Pre-Sorted Indices and Map/Set Lookups

## Knowledge Gaps
- **502 isolated node(s):** `root`, `parser`, `ecmaVersion`, `sourceType`, `@typescript-eslint` (+497 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **58 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button` connect `Shared Buttons Guards` to `Frontend Game Clients`, `Navbar.tsx`, `Results and Toast UI`, `enhanced-page.tsx`, `sections-page.tsx`, `Hand Position Guide 3D`, `Achievement UI Context`, `Achievements Page UI`, `Lesson Typing Interface`, `Visual Keyboard Components`, `Lesson Practice Pages`, `UI Card Toast Primitives`, `Learn Page Content`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `cn()` connect `UI Card Toast Primitives` to `Theme System Landing`, `App Layout Providers`, `Navbar.tsx`, `Typing Test Core`, `Results and Toast UI`, `Hand Position Guide 3D`, `Shared Buttons Guards`, `Achievements Page UI`, `AchievementNotificationToast.tsx`, `Lesson Typing Interface`, `Visual Keyboard Components`, `Learn Page Content`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `.next` connect `Frontend TS Config` to `App Layout Providers`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `root`, `parser`, `ecmaVersion` to the rest of the system?**
  _502 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Game Clients` be split into smaller, more focused modules?**
  _Cohesion score 0.06170598911070781 - nodes in this community are weakly interconnected._
- **Should `Documentation and Audit` be split into smaller, more focused modules?**
  _Cohesion score 0.04421768707482993 - nodes in this community are weakly interconnected._
- **Should `Root Scripts and Deps` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._