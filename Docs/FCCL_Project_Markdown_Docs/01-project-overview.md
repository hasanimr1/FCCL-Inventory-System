# Project Overview

## 1. Project identity
**Project:** FCCL IT Asset & Infrastructure Management Platform  
**Application type:** Centralized web-based IT asset and infrastructure management system.  
**Organization:** FCCL.

The platform is intended to centralize records of physical IT equipment and related operational activities across FCCL head office and four plants.

## 2. Background and problems
Project discussions and the requirements specification identify these problems:
- Asset records are spread across spreadsheets, paper registers and separate systems.
- Records may be duplicated, incomplete or out of date.
- It is difficult to identify the current holder and location of equipment.
- Warranty information is not always easy to track.
- Repairs, transfers and gate passes rely on calls, paper or email.
- Maintenance work is difficult to track from request to closure.
- Spare-parts shortages may be noticed late.
- Historical changes are difficult to trace.
- Management reporting requires manual compilation.
- Head office needs a central view, while plant data must remain restricted to authorized users.

## 3. Main objectives
1. Maintain one reliable inventory of IT assets across head office and all FCCL plants.
2. Track equipment custody and assignment history.
3. Manage maintenance and repair through work orders.
4. Record asset and stock changes with traceable history.
5. Track spare-parts quantities and minimum stock levels.
6. Maintain an audit history showing who did what and when.
7. Enforce role-based access and plant-level data separation.
8. Reduce manual record keeping and improve reporting.

## 4. Organizational coverage
The requirements describe head office and four FCCL plants. Authorized head-office users may have cross-plant visibility. Other users must only access plants within their assigned scope. Final plant names, codes and assignments must come from FCCL.

## 5. Current core scope
The user explicitly selected these four core modules for the current diagram and documentation work:
1. Asset Inventory
2. Spare Parts
3. Work Orders
4. Audit Trail

Each module requires a separate Use-Case Diagram and a separate Sequence Diagram. Do not use the broad module list in Section 2 of the requirements document as the basis for the current diagram set. Module detail is in [[04-core-modules]]; the diagram deliverables are in [[06-workflows-and-diagrams]].

## 6. Existing frontend
The existing prototype is built with React, TypeScript and Vite. The earlier [[project_summary]] describes views for Dashboard, Asset Inventory, Stock and Spares, Supplier Tracking, Rack Visualizer, Work Orders, Audit Trail and Physical Audit Scanner.

The frontend currently uses mock data and frontend state. The plan is to retain the existing UI where practical and replace mock-data operations with backend API calls. The actual repository may have changed since the earlier project summary.

The target stack, and the backend project layout the API work should follow, are defined in [[02-architecture-and-technology]].

## 7. Delivery approach
The user selected a backend-first approach, so the API, database, authentication and business rules are built and tested before the UI is wired to them:
1. Develop the backend locally.
2. Implement database structure, authentication, authorization, business rules and API endpoints.
3. Test the backend independently.
4. Integrate the backend with the existing frontend.
5. Test the integrated application.
6. Transfer the approved system to an FCCL-controlled server/environment.
7. Provide deployment, backup, recovery and handover documentation.

## 8. Terminology
| Term | Meaning |
|---|---|
| Asset | IT equipment owned or managed by FCCL, such as a PC, server, switch, printer or UPS. |
| Asset tag | Unique identifier printed on a label and attached to an asset. |
| Plant | One of FCCL's operating sites. |
| Work order | Tracked request for maintenance, repair or installation work. |
| Stock item | Spare part or consumable whose quantity is tracked. |
| Stock transaction | Recorded receipt, issue, return, transfer or adjustment. |
| Audit trail | Permanent record of system actions and changes. |
| Plant separation | Restricting users to records in their authorized plant scope. Enforced as described in [[03-roles-and-access-control]]. |
| JWT | JSON Web Token used for authenticated API requests. |
| UAT | User Acceptance Testing. |
| RPO | Recovery Point Objective: acceptable data-loss period. |
| RTO | Recovery Time Objective: acceptable recovery duration. |
| PKR | Pakistani Rupee. |
| PKT | Pakistan Standard Time. |

## Related notes
- [[02-architecture-and-technology]] — the stack the project is built on.
- [[03-roles-and-access-control]] — roles and plant scope.
- [[04-core-modules]] — the four modules in scope.
- [[06-workflows-and-diagrams]] — the diagram deliverables.
- [[07-backup-deployment-and-recovery]] — deployment and recovery planning.
- [[08-decisions-and-open-issues]] — decisions and open questions.
