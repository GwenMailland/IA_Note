# Architecture Decision Record — Scalr Microservices Migration

**ADR-001**
**Status**: Approved
**Date**: February 20, 2026
**Authors**: Engineering Team (Marcus, Priya, Sara, Dev, Alex)
**Deciders**: CTO, VP Engineering

---

## 1. Context and Problem

Scalr's monolithic Node.js application has reached critical scalability limits:

- **Performance**: p99 latency at 890ms, degradation above 800 concurrent users
- **Development velocity**: All 5 engineers must coordinate deployments; hotfixes require full redeploy
- **Infrastructure**: Costs scale linearly — cannot scale individual bottlenecks independently
- **Reliability**: A bug in the billing module can bring down the note-taking feature

The team needs an architectural shift before the next fundraising round (Q2 2026), which requires demonstrating 10,000 concurrent user capacity.

---

## 2. Decision

**Split the monolith into 6 domain-bounded microservices**, each with independent data ownership, deployment pipeline, and scalability profile.

---

## 3. Services Architecture

```
                    ┌─────────────────┐
   Clients ────────▶│  AWS API Gateway │
                    └────────┬────────┘
                             │ REST
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌─────────────┐ ┌──────────┐ ┌──────────────┐
       │ auth-service│ │user-svc  │ │workspace-svc │
       └─────────────┘ └──────────┘ └──────────────┘
              │ gRPC         │ gRPC         │ gRPC
              └──────────────┼──────────────┘
                             ▼
                    ┌─────────────────┐
                    │  AWS EventBridge│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌─────────────┐ ┌──────────┐ ┌──────────────┐
       │reporting-svc│ │notif-svc │ │ billing-svc  │
       └─────────────┘ └──────────┘ └──────────────┘
```

### Service Responsibilities

| Service | Responsibility | Tech | Owner |
|---------|---------------|------|-------|
| **auth-service** | JWT issuance, OAuth2, session management | Node.js + Redis | Marcus |
| **user-service** | User profiles, roles, permissions | Node.js + PostgreSQL | Sara |
| **workspace-service** | Notebooks, notes, documents, AI integration | Node.js + PostgreSQL | Dev |
| **reporting-service** | Async report generation, exports | Node.js + SQS | Priya |
| **notification-service** | Email, webhooks, push notifications | Node.js + SES | Alex |
| **billing-service** | Stripe, invoicing, subscription management | Node.js + PostgreSQL | Marcus |

---

## 4. Communication Patterns

### Synchronous (gRPC)
Used for: real-time queries requiring immediate response
- auth-service → user-service (permission checks)
- workspace-service → auth-service (token validation)
- billing-service → user-service (subscription tier checks)

### Asynchronous (AWS EventBridge)
Used for: non-blocking operations, audit logs, notifications
- `note.created` → notification-service, reporting-service
- `subscription.updated` → user-service (quota update)
- `user.deleted` → all services (data cleanup)

### External API (REST via AWS API Gateway v2)
Used for: all client-facing traffic
- Rate limiting: 1,000 req/min per tenant
- Versioning: `/v1/`, `/v2/` URL path strategy
- Auth: AWS IAM + JWT Bearer

---

## 5. Data Ownership

Each service owns its database schema. **Cross-service DB queries are strictly forbidden.**

| Service | Database | Schema |
|---------|----------|--------|
| auth-service | PostgreSQL | `auth.*` |
| user-service | PostgreSQL | `users.*` |
| workspace-service | PostgreSQL | `workspaces.*, notes.*, documents.*` |
| reporting-service | PostgreSQL | `reports.*` |
| notification-service | DynamoDB | `notifications.*` |
| billing-service | PostgreSQL | `billing.*` |

---

## 6. Migration Strategy

Migration follows a **strangler fig pattern** over 3 weeks:

1. **Week 1** (Feb 20 – Feb 28): Extract auth-service and user-service
2. **Week 2** (Mar 1 – Mar 7): Extract workspace-service, reporting-service
3. **Week 3** (Mar 8 – Mar 10): Extract billing-service, notification-service
4. **Go-Live** (Mar 11, 06:00 UTC): Full traffic cutover via DNS change

---

## 7. Trade-offs

### Accepted
- Increased operational complexity (12 deployables vs 1)
- Network latency for gRPC calls (~2ms overhead per hop)
- Distributed tracing required (OpenTelemetry + AWS X-Ray)

### Mitigations
- Automated deployment pipelines per service (GitHub Actions)
- Service mesh (Istio) for observability and traffic management
- On-call runbook with circuit breaker patterns documented

---

## 8. Success Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| p95 latency | 340ms | < 100ms |
| p99 latency | 890ms | < 300ms |
| Concurrent users | 800 | 5,000+ |
| Deployment frequency | 1/week (coordinated) | Multiple/day (per service) |
| MTTR | ~45 min | < 10 min |

---

*Document generated by NoteFlow — 2026-03-08*
