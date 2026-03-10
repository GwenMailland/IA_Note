# Cloud Migration — Scalr Platform

## Context
Technical migration of Scalr's Node.js monolith to 6 microservices on AWS. Team: 5 engineers. Go-live: March 11, 2026 @ 06:00 UTC. Data: 2.3TB PostgreSQL + 180GB S3.

## Evolving Summary
The migration is on track for the March 11 go-live. Architecture (ADR-001) approved: 6 bounded microservices communicating via gRPC internally and REST externally, with AWS EventBridge for async events. Performance baseline established (p95 340ms → target <100ms). Two critical security findings resolved. Database blue-green strategy defined with pglogical. Sprint 4 retro identified context-switching as main friction; dedicated migration days (Mon/Tue) added. Go-live checklist ready, on-call rotation confirmed.

## Timeline
- **Feb 20** — ADR-001 approved: 6 microservices, gRPC/REST/EventBridge
- **Feb 25** — Performance baseline: p95 340ms, N+1 queries = 60% DB load
- **Mar 01** — DB migration strategy: blue-green with pglogical, 4h window
- **Mar 04** — Security audit: 3 findings, HIGH + MEDIUM fixed immediately
- **Mar 05** — ADR-005: AWS API Gateway v2 selected over Kong
- **Mar 07** — Sprint 4 retro: service mesh ahead of schedule, Redis cert fixed
- **Mar 08** — ✅ Go-live checklist finalized, go/no-go call at 05:45 UTC Mar 11

## Pending Actions
- [ ] Go/No-Go call — March 11, 05:45 UTC
- [ ] DNS cutover during migration window
- [ ] S3 blob storage migration plan (Marcus)
- [ ] LOW security finding (verbose errors) — Sprint 5
- [ ] SOC2 Type II audit — April 2026

## Open Questions
- Will LOW security finding block the SOC2 audit?
- Will splitting services eliminate N+1 queries or just move them?
- S3 blob migration: in-window or pre-migration?

## Last Update
2026-03-08T16:00:00.000Z
