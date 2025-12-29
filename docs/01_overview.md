# Warlords — Game Overview

Warlords is a turn-based card strategy game inspired by early modern warfare.

## Platform
- Web-based **PWA**
- Built with **Next.js + TypeScript**
- **Portrait mode only** (mobile-first)

## Players
- 2 players (Human vs AI for MVP)
- Alternating turns

## Core Idea
Each player commands a small army represented by cards:
- Infantry
- Archers
- Cavalry
- Siege units
- Special units (e.g. Scout)

Players attack, defend, and manage limited information to break the opponent’s defenses.

## MVP Constraints (Very Important)
- ❌ No starting draft
- ✅ Each player starts by drawing **6 random cards**
- ❌ No campaign, no meta-progression
- ✅ Single core game screen
- ✅ State-driven UI (phases control what is clickable)

## Source of Truth Priority
1. `.idx/airules.md`
2. Code
3. `docs/*.md`
4. PDF rulebook (if present)
