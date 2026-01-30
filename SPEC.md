# Kid Rewards Web App - MVP Spec (Draft)

## Summary
A single-family, multi-kid web app to track tasks, milestones, allowance, and spending. It supports offline use and a simple role-switch button instead of formal authentication. Data should sync across devices when online.

## MVP Scope
- Multiple kid profiles (name, avatar/color, balance, ledger history).
- Parent/kid role switching via a single **Switch User** button.
- One-off tasks that can span multiple weeks.
- Task checkpoints with configurable schedules (e.g., once/day, twice/day, once/week).
- Milestones attached to tasks for large multi-week efforts.
- Recurring allowance (weekly/monthly) to each kid’s ledger.
- Spending ledger entries (bookkeeping only; no approvals).
- Offline-first experience with local storage and background sync when online.
- AI-assisted daily progress check-ins with the parent.

## Roles & Views
- **Parent view**
  - Create/edit kids.
  - Create/edit tasks, milestones, and checkpoint schedules.
  - Post recurring allowance rules.
  - Review full ledger per kid.
- **Kid view**
  - View assigned tasks, milestones, and checkpoint progress.
  - Mark checkpoints complete.
  - View balance and ledger history.
  - Log spending (bookkeeping only).

## Core Entities
- **Kid**: id, name, avatar/color.
- **Task**: id, title, description, assigned kid(s), reward amount, status.
- **Checkpoint**: id, task id, schedule (daily/weekly/custom), completion log.
- **Milestone**: id, task id, title, optional reward.
- **Allowance Rule**: id, kid id, cadence (weekly/monthly), amount.
- **Ledger Entry**: id, kid id, type (reward/allowance/spend), amount, note, timestamp.

## Key Workflows
1. **Parent creates a task** with optional milestones and checkpoint schedule.
2. **Kid completes checkpoints** over time; milestone progress updates.
3. **Rewards** are recorded in the ledger when tasks/milestones are completed.
4. **Recurring allowance** posts automatically based on cadence.
5. **Spending entries** are recorded without approvals.
6. **AI progress assistant** runs a daily check-in with the parent to review task progress.

## AI Progress Assistant
- Goal: reduce bookkeeping burden through proactive, context-aware check-ins.
- AI prompts the parent daily to review tasks and checkpoint status.
- If tasks have start/end times, AI notifies the parent before the start and end times.
- After end times, AI follows up to capture completion and progress updates.
- AI summarizes overdue checkpoints and suggests updates.
- Parent confirms or adjusts progress; updates are recorded in the ledger/tasks.

## Offline Support
- Use local persistence so the app is functional offline.
- Sync across devices when online (conflict resolution: latest timestamp wins).

## Out of Scope (for MVP)
- Formal authentication.
- Multi-family support.
- Spending approvals.
- External payments or bank integration.
