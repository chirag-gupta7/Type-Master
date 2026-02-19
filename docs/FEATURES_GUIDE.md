# Features Guide

This guide maps major user flows to code entry points.

## Start Typing Test

- Open `/dashboard`
- Main component: `apps/frontend/src/components/TypingTest.tsx`
- Save stats through `testAPI.saveTestResult`

## Learn Path

- Open `/learn`
- Lesson progression and completion use `lessonAPI` calls to `/lessons/*`

## Games and Leaderboards

- Open `/games` and `/leaderboard`
- Backend game routes under `/games/*`

## Achievements

- Open `/achievements`
- Achievement evaluation route: `POST /achievements/check`

## Progress Analytics

- Open `/progress` and `/history`
- Uses test/lesson/game data APIs
