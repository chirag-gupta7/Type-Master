# Feature Inventory

This is the implemented feature set based on current frontend routes and backend APIs.

## Typing Test

- Route: `/dashboard`
- Core: timed tests, WPM/accuracy metrics, result history
- API: `/tests`, `/tests/stats`

## Learning System

- Routes: `/learn`, `/learn/[id]`, `/learn/assessment`, `/learn/coding`, `/learn/normal`
- API: lesson listings, checkpoints, dashboard, progress save/analytics
- Backed by `Lesson` and `UserLessonProgress` models

## Games

- Route: `/games`
- Game categories include leaderboard-backed game modes
- API: game score save, highscores, history, stats

## Achievements

- Route: `/achievements`
- API: list + unlock check + stats/progress
- Models: `Achievement`, `UserAchievement`

## Progress + History

- Routes: `/progress`, `/history`
- Aggregated performance and progression views from tests/lessons/games

## Authentication

- Routes: `/login`, `/register`
- NextAuth + Credentials + Google provider
- Backend token bridge via `/api/v1/auth/token`
