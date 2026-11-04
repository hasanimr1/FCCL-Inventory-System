# FCCL IT Asset & Infrastructure Management Platform

This documentation pack consolidates the relevant project discussions and available project files into categorized, copy/paste-ready Markdown. It contains text only; no pictures are included.

## Files
- [[01-project-overview]] — purpose, background, objectives and current scope.
- [[02-architecture-and-technology]] — frontend, backend, database and development approach.
- [[03-roles-and-access-control]] — current four-role model and permissions.
- [[04-core-modules]] — Asset Inventory, Spare Parts, Work Orders and Audit Trail.
- [[05-data-model-and-business-rules]] — records, relationships and validation rules.
- [[06-workflows-and-diagrams]] — textual workflows and UML diagram requirements.
- [[07-backup-deployment-and-recovery]] — backup, recovery and deployment planning.
- [[08-decisions-and-open-issues]] — current decisions, superseded choices and unresolved items.

## Source material
These notes were consolidated from older inputs. They are kept for traceability, not as current requirements:
- [[project_summary]] — technical snapshot of the existing React frontend prototype.
- [[Asset_Management_Requirements_Specification]] — the supplied requirements document.
- [[Inital Plan]] — an earlier architecture and deployment blueprint.

## Current direction
- Web-based centralized platform for FCCL head office and four plants.
- Frontend: React + TypeScript + Vite.
- Backend: ASP.NET Core Web API + C#.
- ORM: Entity Framework Core.
- Database: Microsoft SQL Server (MSSQL Server).
- Authentication: JWT; authorization: role-based access control.
- Strict plant-level access enforced server-side.
- Local development first; backend developed and tested before frontend integration.
- Existing frontend UI retained where practical; mock-data handling replaced with API integration.
- Live monitoring and the Go endpoint agent deferred from the immediate backend scope.
- Current roles: System Admin, Admin, Employee, Auditor (Read Only).
- Current core diagram modules: Asset Inventory, Spare Parts, Work Orders, Audit Trail.

## Working with these notes
This pack is meant to be read in Obsidian, so the notes link to each other. Start with [[01-project-overview]] for context, then read [[08-decisions-and-open-issues]] to see what is settled and what is not. The linking conventions used here are explained in [[Obsidian Linking Guide]].

## Source and accuracy notes
This is a categorized consolidation, not a verbatim transcript of every message ever exchanged. It reflects relevant project conversation context and retrieved project files. The current user-confirmed decisions take precedence over older documents and prototype definitions.

The supplied requirements specification contains older roles and a proposed technology stack that conflict with later project decisions. Such conflicts are called out in the relevant files. Proposals and suggested questionnaire answers are not treated as confirmed FCCL requirements.
