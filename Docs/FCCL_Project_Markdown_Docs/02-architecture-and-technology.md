# Architecture and Technology

## 1. Current technology direction

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React | User interface and reusable components. |
| Frontend language | TypeScript | Typed frontend code and data contracts. |
| Frontend tooling | Vite | Development server and build tooling. |
| Styling | Existing Tailwind CSS setup | Frontend styling. |
| Backend | ASP.NET Core Web API | API endpoints, validation, business rules and authorization. |
| Backend language | C# | Backend implementation language. |
| ORM | Entity Framework Core | Entity mapping, database access and migrations. |
| Database | Microsoft SQL Server (MSSQL Server) | Persistent application data. |
| Authentication | JWT | Authenticated API requests. |
| Authorization | Role-Based Access Control (RBAC) | Restrict actions according to role and plant scope. |
| API documentation | Swagger / OpenAPI | API exploration and testing. |
| Testing | xUnit was proposed | Unit and integration tests. |
| Source control | Git | Version control and release history. |

**Database correction:** An earlier backend plan selected PostgreSQL. The user later changed the database requirement to MSSQL Server. MSSQL Server is the current direction; PostgreSQL is superseded.

The role model enforced by this stack is defined in [[03-roles-and-access-control]]; the logical records it persists are in [[05-data-model-and-business-rules]]; hosting, backup and recovery are in [[07-backup-deployment-and-recovery]].

## 2. High-level architecture

```text
React + TypeScript + Vite Frontend
              |
              | HTTPS REST API
              | JSON
              | JWT bearer token
              v
ASP.NET Core Web API (C#)
  - Authentication
  - Role and plant authorization
  - Request validation
  - Business services
  - Data access and transactions
  - Audit logging
  - Error handling
              |
              v
Entity Framework Core
              |
              v
Microsoft SQL Server
  - Users and roles
  - Plants and access scope
  - Assets and assignments
  - Spare parts and stock transactions
  - Work orders
  - Audit records
```

A modular monolithic backend is suitable for the current scope. Microservices were not selected as a requirement. The four modules this backend serves are defined in [[04-core-modules]].

## 3. Protected request flow
1. User signs in through the frontend.
2. Backend validates credentials.
3. Backend issues a JWT after successful authentication.
4. Frontend includes the token in protected API requests.
5. Backend validates the token.
6. Backend checks role and plant scope.
7. Backend validates input and business rules.
8. Backend reads or updates MSSQL through EF Core.
9. Relevant changes are recorded in the Audit Trail.
10. API returns a consistent response.
11. Frontend updates or reloads the affected screen.

Authorization must be enforced by the backend. Hiding a button in the UI is not sufficient security.

## 4. Backend-first development
- Build and test the backend before frontend integration.
- Develop locally first.
- Keep the existing frontend UI where practical.
- Replace mock-data handlers with API calls.
- Refactor data handling only where required.
- Do not use mock data as the production source of truth.

The existing UI and its mock-data handlers are catalogued in [[project_summary]]; treat that note as an inventory of what has to be swapped, not as a specification.

## 5. Suggested backend organization

```text
backend/
├── FCCL.Inventory.sln
├── src/
│   ├── FCCL.Inventory.Api/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Authorization/
│   │   └── Program.cs
│   ├── FCCL.Inventory.Application/
│   │   ├── DTOs/
│   │   ├── Interfaces/
│   │   ├── Services/
│   │   └── Validators/
│   ├── FCCL.Inventory.Domain/
│   │   ├── Entities/
│   │   ├── Enums/
│   │   └── Rules/
│   └── FCCL.Inventory.Infrastructure/
│       ├── Persistence/
│       ├── Configurations/
│       ├── Migrations/
│       └── Repositories/
└── tests/
    ├── FCCL.Inventory.UnitTests/
    ├── FCCL.Inventory.IntegrationTests/
    └── FCCL.Inventory.AuthorizationTests/
```

This is a proposed organization, not a claim about the current repository.

## 6. Data consistency principles
- Use stable backend-generated primary keys.
- Apply unique constraints to identifiers such as asset tags and SKUs.
- Use foreign keys for relationships.
- Use database transactions for operations affecting multiple records.
- Validate important business rules on the server.
- Store monetary values using fixed-precision decimal types.
- Store timestamps consistently in UTC and display them in PKT, subject to final policy.
- Preserve assignment and stock transaction history.
- Enforce plant scope in backend queries.
- Never trust a plant ID supplied by the frontend without validating the authenticated user's access.

## 7. Deferred monitoring
The prototype includes simulated heartbeats and live device status. Earlier planning explicitly deferred live monitoring and the Go endpoint agent from the immediate backend scope. Simulated frontend activity must not be treated as real monitoring data.

## 8. Older architecture proposals
The requirements specification proposed Next.js, NestJS, PostgreSQL, Keycloak, Redis, WebSockets, BullMQ, Docker and NGINX. These are historical proposals, not the current confirmed stack. Do not add them as required infrastructure without explicit approval. The earlier blueprint that contains some of them is [[Inital Plan]]; the full proposal set is in [[Asset_Management_Requirements_Specification]]. Superseded decisions are logged in [[08-decisions-and-open-issues#2. Superseded information]].

## Related notes
- [[01-project-overview]] — scope and delivery approach.
- [[03-roles-and-access-control]] — roles, JWT and RBAC rules.
- [[05-data-model-and-business-rules]] — the records this architecture persists.
- [[07-backup-deployment-and-recovery]] — environments, hosting and backup.
- [[08-decisions-and-open-issues]] — superseded stack choices.
- [[project_summary]] — the current frontend implementation.
