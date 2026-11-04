**IT Asset & Infrastructure  
Management System**

*Requirements Specification*

| | |
|---|---|
| **Client** | FCCL |
| **Coverage** | Head office and four plants |
| **Delivery** | Two phases: pilot, then full rollout |
| **Date** | November 2026 |

> [!warning] Source document, partly superseded
> This is the supplied requirements specification. Several parts conflict with later user-confirmed decisions: the role list, the proposed technology stack, the asset and work-order status sets, and FR-024. Where it conflicts, [[08-decisions-and-open-issues]] and the numbered notes take precedence. See also [[03-roles-and-access-control]] and [[02-architecture-and-technology]].

---

## Contents

- [1. Introduction](#1-introduction)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Project Overview](#12-project-overview)
  - [1.3 Scope](#13-scope)
  - [1.4 Intended Audience](#14-intended-audience)
  - [1.5 Definitions and Abbreviations](#15-definitions-and-abbreviations)
- [2. Business Background and Objectives](#2-business-background-and-objectives)
  - [2.1 Background](#21-background)
  - [2.2 Problem Statement](#22-problem-statement)
  - [2.3 Business Objectives](#23-business-objectives)
- [3. Stakeholders & Users](#3-stakeholders--users)
  - [Stakeholders](#stakeholders)
  - [3.2 User Roles](#32-user-roles)
- [4. Current State (As-Is)](#4-current-state-as-is)
- [5. Scope and Modules](#5-scope-and-modules)
  - [5.1 Module List](#51-module-list)
- [6. Functional Requirements](#6-functional-requirements)
- [7. Non-Functional Requirements](#7-non-functional-requirements)
- [8. Sequence Diagrams](#8-sequence-diagrams)
  - [8.1 Asset Inventory System](#81-asset-inventory-system)
  - [8.2 Spare Parts System](#82-spare-parts-system)
  - [8.3 Work Orders](#83-work-orders)
  - [8.4 Audit Trail](#84-audit-trail)
- [9. Use Case Diagrams](#9-use-case-diagrams)
  - [9.1 Asset Inventory System](#91-asset-inventory-system)
  - [9.2 Spare Parts System](#92-spare-parts-system)
  - [9.3 Work Orders](#93-work-orders)
  - [9.4 Audit Trail](#94-audit-trail)
- [10. Data Requirements](#10-data-requirements)
  - [10.1 Main Data Records](#101-main-data-records)
  - [10.2 Asset Record Fields](#102-asset-record-fields)
  - [10.3 Data Retention](#103-data-retention)
- [11. Interface Design](#11-interface-design)
  - [11.1 Main Dashboard](#111-main-dashboard)
  - [11.2 Device & Hardware Inventory](#112-device--hardware-inventory)
  - [11.3 Stock & Spare Parts](#113-stock--spare-parts)
  - [10.4 Racks Visualizer](#104-racks-visualizer)
  - [11.5 Work Orders Screen](#115-work-orders-screen)
  - [11.6 Supplier & Hardware Vendor](#116-supplier--hardware-vendor)
  - [11.7 Audit Trail Activity Log](#117-audit-trail-activity-log)
- [12. Security Requirements](#12-security-requirements)
- [13. Reporting Requirements](#13-reporting-requirements)
- [14. Technical Overview and Deployment](#14-technical-overview-and-deployment)
  - [14.1 Proposed Technology](#141-proposed-technology)
  - [14.2 Hosting and Deployment](#142-hosting-and-deployment)
- [15. Assumptions, Constraints, Dependencies and Risks](#15-assumptions-constraints-dependencies-and-risks)
  - [15.1 Assumptions](#151-assumptions)
  - [15.2 Constraints](#152-constraints)
  - [15.3 Dependencies](#153-dependencies)
  - [15.4 Risks](#154-risks)
- [16. Deliverables](#16-deliverables)
  - [16.1 Overview](#161-overview)
  - [16.2 Deliverables List](#162-deliverables-list)
  - [16.3 Handover and Acceptance](#163-handover-and-acceptance)
  - [16.4 Not Included](#164-not-included)
- [17. Acceptance Criteria and Testing](#17-acceptance-criteria-and-testing)
- [18. Open Issues and Decisions](#18-open-issues-and-decisions)
- [19. Approval and Sign-off](#19-approval-and-sign-off)
- [Appendix A. Questionnaire Response Log](#appendix-a-questionnaire-response-log)
- [Appendix B. Role and Module Access Matrix](#appendix-b-role-and-module-access-matrix)

## List of Figures

- Infographic 1: Solution architecture at a glance
- Infographic 2: Business objectives at a glance
- Infographic 3: User roles and plant separation
- Infographic 4: Module delivery by phase
- Infographic 5: Asset lifecycle statuses
- Figure#1 Sequence Diagram of Asset Inventory System
- Figure#2 Sequence Diagram of Spare Parts System
- Figure#3 Sequence Diagram of Work Orders
- Figure#4 Sequence Diagram of Audit Trail
- Figure#1 Use Case Diagram of Asset Inventory System
- Figure#2 Use Case Diagram of Spare Parts System
- Figure#3 Use Case Diagram of Work Orders
- Figure#4 Use Case Diagram of Audit Trail
- Figure#1 Main Dashboard
- Figure#2 Device & Hardware Inventory Screen
- Figure#3 Stock & Spare Parts Screen
- Figure#4 Racks Visualizer Screen
- Figure#5 Work Orders Screen
- Figure#6 Supplier & Hardware Vendor Tracking Screen
- Figure#7 Audit Trail Activity Log Screen

---

# 1. Introduction

## 1.1 Purpose

This document describes what the IT Asset and Infrastructure Management System must do. It turns the answers from the requirements questionnaire into clear, testable requirements. The project team will use it to design and build the system, and **FCCL will use it to confirm that the right system is being built and, later, to accept it.**

## 1.2 Project Overview

The IT Asset and Infrastructure Management Platform is a centralized, web-based system for tracking FCCL’s physical IT equipment across head office and four plants. It records each asset’s location, specifications, network connections, owner, lifecycle, status and maintenance history. It covers servers, switches, racks, cables and PCs, and it can support new equipment types without code changes.

The Head office gets one view of all assets, while each plant sees only its own data, enforced inside the database. The platform combines a web application, a secure API, a database with flexible custom fields, and live device status. Status comes from network checks (ping and SNMP) and from inventory tools FCCL already uses, so no software has to be installed on PCs. A small collector at each plant gathers these results, and it keeps them if the link to head office drops.

Delivery is in two phases. Phase 1 is a pilot built by four developers on a <mark>four-week baseline,</mark> which is a target and not a fixed deadline. It covers login, plant separation, asset records, employee assignment, QR labels, work orders and an audit trail. Phase 2 adds the remaining features, such as the rack view, cable mapping and stock management. It also adds a security test and the rollout to the other three plants.

![Infographic 1: Solution architecture at a glance](media/infographic-1.png)

*Infographic 1: Solution architecture at a glance*

## 1.3 Scope

**In scope:** a web-based system to record and manage IT assets and infrastructure at head office and the four FCCL plants, covering the 21 modules listed in section 5.2.

- Asset records, employee assignment, asset movement and gate pass, work orders, vendors and warranty.

- Racks, ports and cables, stock and spare parts, software licences.

- Alerts, physical audits with QR labels, reports and dashboards, import and export, audit trail, and document storage.

## 1.4 Intended Audience

Project sponsor and management, FCCL IT, plant administrators, the development and testing team, and auditors.

## 1.5 Definitions and Abbreviations

| **Term**             | **Meaning**                                                                                                    |
|----------------------|----------------------------------------------------------------------------------------------------------------|
| **Asset**            | Any IT item FCCL owns and tracks, such as a PC, server, switch, printer or UPS.                                |
| **Asset tag**        | The unique number printed on a label and attached to an asset.                                                 |
| **Plant**            | One of FCCL's four sites. The Head office is treated as a location with its own records.                       |
| **Work order**       | A request to carry out maintenance, repair or installation work, tracked until it is closed.ff                 |
| **Gate pass**        | An approved document that allows an asset to leave or enter a plant.                                           |
| **Audit trail**      | A permanent record of who did what and when in the system.                                                     |
| **Physical audit**   | Checking that assets recorded in the system really exist at the recorded place.                                |
| **SSO / MFA**        | Single sign-on (one company login) and multi-factor authentication (a second check at login).                  |
| **Plant separation** | Users see only the data of their own plant, enforced inside the database.                                      |
| **Pilot**            | A trial launch at one plant before rolling out to all plants.                                                  |
| **RPO / RTO**        | Recovery point objective (how much data can be lost) and recovery time objective (how long recovery may take). |
| **PKT**              | Pakistan Standard Time. All times are stored in PKT.                                                           |

# 2. Business Background and Objectives

## 2.1 Background

FCCL operates four plants and a head office. IT equipment across these locations is currently tracked in <mark>spreadsheets, paper registers and separate systems</mark>. The Head office cannot easily see what equipment exists at each plant, who holds it, or when it needs repair or renewal.

## 2.2 Problem Statement

1.  Records are scattered, can be duplicated or out of date, and have no reliable history.

2.  It is hard to know who holds a device, where it is, and whether its warranty is still valid.

3.  Repairs, transfers and gate passes depend on phone calls and paper, so they are slow and difficult to audit.

4.  Management cannot get quick, accurate reports across plants.

## 2.3 Business Objectives

| **ID**   | **Objective**                                          | **How we will measure it**                                                 |
|----------|--------------------------------------------------------|----------------------------------------------------------------------------|
| **BO-1** | One reliable inventory of IT assets across all plants. | \[95%\] of pilot-plant assets verified by physical scan before sign-off.   |
| **BO-2** | Clear custody of every device.                         | Every assigned device shows its current holder and full history.           |
| **BO-3** | Faster, controlled maintenance.                        | All repairs go through work orders. Average time to close is reported.     |
| **BO-4** | Controlled movement of assets.                         | All inter-plant transfers and gate passes are recorded and approved.       |
| **BO-5** | Early warning of problems.                             | Warnings for warranty, stock and offline devices sent 30 days ahead.       |
| **BO-6** | Accountability.                                        | Every change can be traced to a person, a time and the old and new values. |
| **BO-7** | Plant data separation.                                 | Zero cases of cross-plant data access in security tests.                   |
| **BO-8** | Reliable reporting.                                    | Management reports are available on demand without manual work.            |

![Infographic 2: Business objectives at a glance](media/infographic-2.png)

*Infographic 2: Business objectives at a glance*

# 3. Stakeholders & Users

## Stakeholders

| **Stakeholder**              | **Responsibility**                                                  | **Name**  |
|------------------------------|---------------------------------------------------------------------|-----------|
| **Project sponsor**          | Approves scope, budget and phase gates.                             | \[Name\]  |
| **Product owner**            | Owns the requirements, answers questions quickly, accepts the work. | \[Name\]  |
| **FCCL IT head**             | Provides servers, network access and security approvals.            | \[Name\]  |
| **Plant administrators (4)** | Day-to-day users and process owners for each plant.                 | \[Names\] |
| **Security reviewer**        | Reviews security design and arranges testing.                       | \[Name\]  |
| **Project team**             | Designs, builds, tests and deploys the system.                      | \[Names\] |

## 3.2 User Roles

The roles below are proposed from the project brief and must be confirmed. A detailed role and module matrix is in Appendix B.

| **Role**                | **Description**                                 | **Typical tasks**                                                    |
|-------------------------|-------------------------------------------------|----------------------------------------------------------------------|
| **System Admin**        | Head-office administrator for the whole system. | Manage plants, users, asset types, settings; view all plants.        |
| **Plant Admin**         | Administrator for one plant.                    | Manage assets, employees, work orders and approvals for their plant. |
| **Auditor (read only)** | Reviews records and history.                    | View assets, assignments, work orders and the audit trail; no edits. |
| **Employee**            | Holds company equipment.                        | View every device, confirm receipt and return.                       |

![Infographic 3: User roles and plant separation](media/infographic-3.png)

*Infographic 3: User roles and plant separation*

# 4. Current State (As-Is)

Complete this section from the questionnaire answers and the sample records provided by FCCL. It shows what the system replaces and what pain points it must fix.

| **Area**                         | **How it is done today**                                  | **Main problems**                                     |
|----------------------------------|-----------------------------------------------------------|-------------------------------------------------------|
| **Asset records**                | <mark>Excel sheets, paper registers</mark>   | <mark>Duplicates, missing details</mark> |
| **Employee records**             | <mark>FCCL employee management system</mark> | <mark>Data not linked to assets</mark>   |
| **Assignment of devices**        | <mark>Using EMS and Documents</mark>         | <mark>No history, no confirmation</mark> |
| **Stock and spare parts**        | <mark>Store documents</mark>                 | <mark>Low stock noticed late</mark>      |
| **Vendor records**               | <mark>SAP or spreadsheets</mark>             | <mark>Not linked to assets</mark>        |
| **Maintenance and repairs**      | <mark>Calls, paper forms, email</mark>       | <mark>No tracking or priorities</mark>   |
| **Asset movement and gate pass** | <mark>Paper passes, verbal approval</mark>   | <mark>Hard to audit</mark>               |
| **Physical audits**              | <mark>Periodic manual counts</mark>          | <mark>Slow, results not recorded</mark>  |
| **Reporting**                    | <mark>Manual monthly compilation</mark>      | <mark>Late, inconsistent</mark>          |

# 5. Scope and Modules

## 5.1 Module List

| **\#** | **Module**                      | **Purpose**                                                     | **Phase**                   |
|--------|---------------------------------|-----------------------------------------------------------------|-----------------------------|
| 1      | Login and Access Control        | Sign-in, roles, permissions, plant separation.                  | 1                           |
| 2      | Plants and Locations            | Plants, rooms and locations.                                    | 1                           |
| 3      | Asset Records                   | Create, search and manage assets through their life.            | 1                           |
| 4      | Asset Types and Custom Fields   | Define equipment types and their extra fields.                  | 1                           |
| 5      | Employee Records                | Employee data used for custody. Record entered by System Admin. | 1                           |
| 6      | Asset Assignment                | Assign, transfer, return, confirm receipt.                      | 1                           |
| 7      | Rack and Server Room Management | Racks and equipment positions. Visual rack view follows later.  | 1 basic, 2 visual           |
| 8      | Hardware Change Tracking        | Detect and record hardware changes.                             | 2                           |
| 9      | Work Orders                     | Maintenance and repair requests.                                | 1 basic                     |
| 10     | Gate Pass and Asset Movement    | Transfers and approved movement in and out of plants.           | <mark>1</mark> |
| 11     | Stock and Spare Parts           | Quantities, issue, receipt, low-stock warnings.                 | 2                           |
| 12     | Vendors and Contracts           | Supplier records and support contracts.                         | 1 vendors, 2 contracts      |
| 13     | Warranty Management             | Warranty dates and reminders.                                   | 1                           |
| 14     | Alerts and Notifications        | Warnings sent to the right people.                              | 1 basic                     |
| 15     | Physical Audit and Verification | Check recorded assets against what is on site.                  | 1 basic                     |
| 16     | Import and Export               | Load data from Excel and download records.                      | 1                           |
| 17     | Reports and Dashboard           | Summaries for plants and head office.                           | 1 basic, 2 extended         |
| 18     | Audit Trail                     | Permanent log of actions.                                       | 1                           |
| 19     | Document Storage                | Invoices, warranty papers and photos.                           | 1 basic                     |
| 20     | Backup and Recovery             | Daily backups and tested restore.                               | 1                           |
| 21     | System Settings                 | Configuration without code changes.                             | 1                           |

![Infographic 4: Module delivery by phase](media/infographic-4.png)

*Infographic 4: Module delivery by phase*

# 6. Functional Requirements

Priorities and statuses are proposals until FCCL confirms them.

| **ID** | **Module**                                 | **Requirement**                                                                                                                                                                                                                                                                                                                                                                                                                                           | **Priority** | **Status**   |
|--------|--------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|--------------|
| FR-001 | Login and Access                           | The system shall let users sign in and shall require two-step verification for administrator accounts.                                                                                                                                                                                                                                                                                                                                                    | Must         | **Open**     |
| FR-002 | Roles and Permissions                      | The system shall support the roles **System Admin**, **Employee**, **Auditor (**read only) and. System Admin manages the four role logins (reset passwords, enable, disable).                                                                                                                                                                                                                                                                             | Must         | **Open**     |
| FR-003 | Plants and Plant Separation                | The system shall record plants, buildings and rooms in a hierarchy, support four plants and head office at launch, and let a new plant be added by configuration without new code. Every plant-level record shall carry its plant. Each user shall see only their assigned plant or plants, enforced inside the database. Head-office roles may see all plants .                                                                                          | Must         | **Proposed** |
| FR-004 | Asset Records                              | The system shall record for each asset: asset tag, serial number, type, brand, model, status, plant, location, vendor, purchase date, warranty end date and cost in PKR. It shall create a unique asset tag (e.g EQP:001) , never reuse a tag, and warn or block when a serial number or tag already exists.                                                                                                                                              | Must         | **Proposed** |
| FR-005 | Asset Types and Settings                   | A System Admin shall create asset types with their own extra fields (for example RAM for servers) and configure statuses, priorities, tag format, alert rules, approval rules and lookup lists (such as departments and categories) without code changes. Every settings change shall be recorded in the audit trail.                                                                                                                                     | Must         | **Proposed** |
| FR-006 | Asset Lifecycle                            | The system shall support the asset statuses In Use, In Stock, Under Repair, Damaged, Missing and Disposed. Assets shall never be permanently deleted. Retired assets shall be archived with their history, and disposal or scrapping shall need System Admin approval<mark>.</mark>                                                                                                                                                          | Must         | **Open**     |
| FR-007 | Employee Records                           | The system shall store only employee ID, name, department, job title, plant, status and work contact details, loaded from records provided by the System Admin.                                                                                                                                                                                                                                                                                           | Must         | **Open**     |
| FR-008 | Asset Assignment                           | The system shall allow one employee to hold several assets, and shall record every assignment, transfer and return with date, person and reason, keeping the full history.                                                                                                                                                                                                                                                                                | Must         | **Proposed** |
| FR-009 | Receipt, Return and Leavers                | The employee shall confirm receipt and return of a device in the system. If the employee has no account, only a System Admin can confirm on their behalf. When an employee leaves or changes department, the system shall list the assets still held and require return or reassignment.                                                                                                                                                                  | Must         | **Open**     |
| FR-010 | Transfer Requests and Approval             | The system shall let authorized staff request the move of one or more assets between employees, departments, locations or plants, with reason, from, to and date. Inter-plant moves shall be approved by System Admin. A transfer shall have the statuses Requested, Approved, Dispatched, In Transit, Received, Rejected and Cancelled.                                                                                                                  | Must         | **Open**     |
| FR-011 | Dispatch, Receipt and Tracking             | The system shall record dispatch and receipt by named people, with date, condition and transport details. The asset’s plant shall change on arrival, and the asset shall show as In Transit until received. The system shall flag assets that arrive damaged, arrive late or do not arrive, assign a person to follow up, keep every movement in the asset’s history.                                                                                     | Must         | **Open**     |
| FR-012 | Gate Pass                                  | The system shall create a printable gate pass with a QR code for assets leaving a plant, and record the check at the gate.                                                                                                                                                                                                                                                                                                                                | Must         | **Open**     |
| FR-013 | Work Order Creation                        | The system shall record for each work order: description, asset, plant, location, priority (Low, Medium, High, Critical, with target response times), reporter, date and type of work. Staff shall be able to report a problem without knowing the asset, and an authorized person shall link the asset later.                                                                                                                                            | Must         | **Open**     |
| FR-014 | Work Order Handling                        | A work order shall move through the statuses New, Approved, Assigned, In Progress, On Hold, Resolved, Closed and Reopened. System Admin shall assign work orders to vendors and see unassigned ones. The system shall update the asset status automatically (for example Under Repair, then In Use), flag overdue work orders, and track repairs done by outside vendors (date sent, expected return, cost, result).                                      | Must         | **Proposed** |
| FR-015 | Stock and Spare Parts                      | The system shall track spare parts and consumables by item, quantity and plant, record each receipt, issue, return and transfer with person, date and reason, and warn when stock falls to the minimum quantity set for each item.                                                                                                                                                                                                                        | Must         | **Proposed** |
| FR-016 | Vendors                                    | The system shall record vendor type, name, contact person, phone, email, address, tax number, products and the plants served, and give each vendor a unique ID. Only authorized roles shall add or edit vendors, and vendors no longer used shall be marked inactive with their history kept.                                                                                                                                                             | Should       | **Open**     |
| FR-017 | Purchase, Warranty, Contracts and Licenses | The system shall record purchase date, cost, order number and invoice, and let users attach invoices, warranty papers and photos to assets, vendors and work orders. It shall record warranty start, end and terms and warn <mark>30</mark> days before expiry, with warnings going to System Admin. It shall also track support and maintenance contracts and software licences with dates, coverage and renewal reminders.                 | Must         | **Open**     |
| FR-018 | Racks                                      | The system shall record racks (height such as 42U or 48U, location, numbering direction, power and weight limits), record each device’s rack position including half-U positions, prevent overlapping positions, and show which positions are occupied and free, with a front rack view.                                                                                                                                                                  | Should       | **Proposed** |
| FR-019 | Change Requests                            | The system shall record a change request (change, reason, affected equipment, impact, requester, planned date), <mark>define which changes need approval and who approves</mark>, and record the decision (approved, rejected, cancelled) with a reason.                                                                                                                                                                                     | Should       | **Open**     |
| FR-020 | Physical Audit and QR Codes                | The system shall create a printable QR or barcode label for every asset. Staff shall scan a label on a phone browser to confirm the asset exists, its location and its status. Differences and missing or misplaced assets shall be recorded as findings for review, not corrected automatically, and System Admin shall approve the results.                                                                                                             | Must         | **Proposed** |
| FR-021 | Alerts and Notifications                   | The system shall raise alerts for warranty expiry, low stock, devices offline too long, overdue work orders and overdue returns. Alert rules (limits, recipients) shall be configurable for each plant. Alerts shall go only to users with the right role and plant, appear in the system and be sent by email.                                                                                                                                           | Must         | **Open**     |
| FR-022 | Import and Export                          | The system shall import assets, employees, vendors and stock from Excel or CSV using provided templates, check each row and produce an error report. Every export shall be recorded in the audit trail.                                                                                                                                                                                                                                                   | Must         | **Proposed** |
| FR-023 | Dashboard, Reports and Search              | After login the dashboard shall show total assets, assets by status and plant, warranties expiring, pending work orders, open alerts and recent changes. Users shall search assets by tag, serial number, type, plant, status and holder, and filter reports by plant, department, date, asset type and status. The Head office shall see all plants, and plant users shall see only their plant.                                                         | Must         | **Open**     |
| FR-024 | Audit Trail                                | The system shall record every create, edit, archive, assignment, transfer, approval and sign-in action, plus failed sign-ins and blocked access attempts, across all modules. Each entry shall show who, when, what, and the old and new values, and automatic actions shall be marked as system actions. No user shall be able to edit or delete entries, and any tampering shall be detectable. Everyone shall search, view and export the audit trail. | Must         | **Open**     |

![Infographic 5: Asset lifecycle statuses](media/infographic-5.png)

*Infographic 5: Asset lifecycle statuses*

# 7. Non-Functional Requirements

Priorities and statuses are proposals until FCCL confirms them.

| **ID**      | **Area**                   | **Requirement**                                                                                                                                   | **Status**    |
|-------------|----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| **NFR-001** | Performance                | Search and list pages respond within 2 seconds for 95% of requests at the planning size.                                                          | **Proposed**  |
| **NFR-002** | Availability               | Available during business hours. Planned downtime is outside working hours.                                                                       | **Open**      |
| **NFR-003** | Backup                     | Daily encrypted backups stored in the MySQL (database).                                                                                           | **Proposed**  |
| **NFR-004** | Security                   | Encrypted traffic (HTTPS) and encryption at rest. Passwords and keys held in a secret store. Security test before rollout beyond the pilot plant. | **Proposed**  |
| **NFR-005** | Usability                  | English interface. Pages work on mobile browsers for scanning. Supports current Chrome and Edge.                                                  | **Confirmed** |
| **NFR-006** | Local settings             | Times stored in PKT and shown in PKT. Money shown in PKR.                                                                                         | **Confirmed** |
| **NFR-007** | Data protection            | Only the minimum employee data is stored, with role-based access, following FCCL policy and applicable law.                                       | **Proposed**  |
| **NFR-008** | Scalability                | A new plant is added by configuration, not code.                                                                                                  | **Proposed**  |
| **NFR-009** | Maintainability            | Documented interfaces, automated tests, and settings instead of code for rules.                                                                   | **Proposed**  |
| **NFR-010** | Accessibility              | Keyboard operation and readable colors.                                                                                                           | **Proposed**  |
| **NFR-011** | Documentation and training | User guide, administrator guide, installation guide and training for each role.                                                                   | **Proposed**  |

# 8. Sequence Diagrams

## 8.1 Asset Inventory System

![](media/image2.png)

*<mark>Figure#1 Sequence Diagram of Asset Inventory System</mark>*

## 8.2 Spare Parts System

![](media/image1.png)

*<mark>Figure#2 Sequence Diagram of Spare Parts System</mark>*

## 8.3 Work Orders

![](media/image9.png)

*<mark>Figure#3 Sequence Diagram of Work Orders</mark>*

## 8.4 Audit Trail

![](media/image10.png)

*<mark>Figure#4 Sequence Diagram of Audit Trail</mark>*

# 9. Use Case Diagrams

## 9.1 Asset Inventory System

![](media/image13.png)

*<mark>Figure#1 Use Case Diagram of Asset Inventory System</mark>*

## 9.2 Spare Parts System

![](media/image15.png)

*<mark>Figure#2 Use Case Diagram of Spare Parts System</mark>*

## 9.3 Work Orders

![](media/image12.png)

*<mark>Figure#3 Use Case Diagram of Work Orders</mark>*

## 9.4 Audit Trail

![](media/image14.png)

*<mark>Figure#4 Use Case Diagram of Audit Trail</mark>*

# 10. Data Requirements

## 10.1 Main Data Records

| **Record**                  | **Key information**                                                     | **Linked to**                       |
|-----------------------------|-------------------------------------------------------------------------|-------------------------------------|
| **Plant / Location**        | Name, code, type, parent location.                                      | All plant-level records.            |
| **Asset**                   | Tag, serial number, type, status, plant, location, vendor, dates, cost. | Employee, vendor, rack, work order. |
| **Asset type**              | Type name, extra fields and rules, version.                             | Asset.                              |
| **Employee**                | ID, name, department, title, plant, status.                             | Assignment.                         |
| **Assignment**              | Asset, employee, start and end date, confirmation.                      | Asset, employee.                    |
| **Movement / Gate pass**    | Assets, from, to, reason, approvals, dispatch and receipt.              | Asset, plants.                      |
| **Work order**              | Description, asset, priority, status, technician, work done.            | Asset, stock, vendor.               |
| **Vendor / Contract**       | Contact details, products, contracts, warranty terms.                   | Asset, stock.                       |
| **Stock item**              | Item, quantity, minimum level, plant, cost.                             | Vendor, work order.                 |
| **Status history**          | Device, status, time.                                                   | Asset.                              |
| **Change event**            | Asset, field, before, after, time, linked work order.                   | Asset, work order.                  |
| **Audit session / finding** | Plant, date, assets checked, differences.                               | Asset.                              |
| **Audit trail entry**       | User, action, time, record, old and new values.                         | All records.                        |
| **Document**                | File name, type, size, linked record.                                   | Asset, vendor, work order.          |

## 10.2 Asset Record Fields

| **Field**                     | **Type**           | **Required** | **Notes**                                                   |
|-------------------------------|--------------------|--------------|-------------------------------------------------------------|
| **Asset tag**                 | Text               | Yes          | Unique, system generated, never reused.                     |
| **Serial number**             | Text               | Yes          | Unique per vendor and model.                                |
| **Asset type**                | List               | Yes          | Decides which extra fields appear.                          |
| **Brand and model**           | Text               | Yes          |                                                             |
| **Status**                    | List               | Yes          | In Use, In Stock, Under Repair, Damaged, Missing, Disposed. |
| **Plant and location**        | List               | Yes          | Room and rack position if relevant.                         |
| **Assigned to**               | Employee           | No           | Current holder.                                             |
| **Vendor**                    | List               | No           | Supplier of the asset.                                      |
| **Purchase date and cost**    | Date, number (PKR) | No           | Cost required if finance reporting is needed.               |
| **Warranty start and end**    | Date               | No           | Drives warranty alerts.                                     |
| **MAC address, hostname, IP** | Text               | No           |                                                             |
| **Extra fields**              | Depends on type    | Per type     | For example RAM, CPU, port count.                           |
| **Notes and documents**       | Text, files        | No           |                                                             |

## 10.3 Data Retention

| **Data**                              | **Retention**                                              | **Status** |
|---------------------------------------|------------------------------------------------------------|------------|
| **Asset and assignment history**      | Life of the asset plus past employees it was assigned to.  | **Open**   |
| **Audit trail**                       | <mark>All Time (Can be filtered)</mark>       | **Open**   |
| **Life of Asset plus past Employees** | <mark>12 months</mark> online, then archived. | **Open**   |
| **Employee data**                     | As per FCCL HR policy.                                     | **Open**   |
| **Backups**                           | <mark>30 days</mark>.                         | **Open**   |

# 11. Interface Design

## 11.1 Main Dashboard

![](media/image6.png)

*Figure#1 Main Dashboard*

## 11.2 Device & Hardware Inventory

![](media/image8.png)

*Figure#2 Device & Hardware Inventory Screen*

## 11.3 Stock & Spare Parts

![](media/image7.png)

*Figure#3 Stock & Spare Parts Screen*

## 10.4 Racks Visualizer

![](media/image5.png)

*Figure#4 Racks Visualizer Screen*

## 11.5 Work Orders Screen

![](media/image4.png)

*Figure#5 Work Orders Screen*

## 11.6 Supplier & Hardware Vendor

![](media/image3.png)

*Figure#6 Supplier & Hardware Vendor Tracking Screen*

## 11.7 Audit Trail Activity Log

![](media/image11.png)

*Figure#7 Audit Trail Activity Log Screen*

# 12. Security Requirements

| **Area**                  | **Requirement**                                                                                                               |
|---------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| **Authentication**        | Role login. Two-step verification for administrators. Account lock after repeated failed attempts.                            |
| **Authorization**         | Role-based permissions enforced by the server. The screen shows only what the role may do.                                    |
| **Plant separation**      | Each plant's data is separated inside the database. Automated tests check this for every role.                                |
| **Audit trail**           | Permanent, tamper-evident log that no user can edit or delete.                                                                |
| **Data protection**       | Encrypted traffic and storage. Minimum employee data. Backups encrypted.                                                      |
| **Secrets**               | Passwords, keys and certificates kept in a secrets store, never in code.                                                      |
| **Application security**  | Input checks and protection against common web attacks. Request rate limits. Regular scans for known vulnerabilities.         |
| **Security testing**      | Internal security review before the pilot. Independent penetration test and access review before rollout to the other plants. |
| **Privacy**               | The system does not read user files or personal content on any device.                                                        |
| **Shared Login Controls** | strong passwords, regular password change, session timeout and lockout.                                                       |

# 13. Reporting Requirements

Confirm the five most important reports. The list below is a starting point.

| **Report**                                | **Audience**             | **How often**    | **Format**    | **Priority** |
|-------------------------------------------|--------------------------|------------------|---------------|--------------|
| **Asset register by plant**               | Plant Admin, head office | On demand        | Screen, Excel | Must         |
| **Assets by type and status**             | Employee, Admin          | On demand        | Screen, PDF   | Must         |
| **Warranties expiring**                   | Plant Admin              | Weekly           | Screen, email | Must         |
| **Assets held by each employee**          | Plant Admin              | On demand        | Screen, Excel | Must         |
| **Missing and unverified assets**         | Auditor, Plant Admin     | After each audit | Screen, PDF   | Must         |
| **Work order summary and ageing**         | System Admin             | Weekly           | Screen, Excel | Should       |
| **Stock levels and low stock**            | System Admin             | Weekly           | Screen, Excel | Should       |
| **Assets in transit and overdue returns** | Plant Admin              | Daily            | Screen        | Should       |
| **Contracts and licences due**            | System Admin             | Monthly          | Screen, email | Should       |
| **Audit trail extract**                   | Auditor                  | On demand        | PDF, Excel    | Must         |

# 14. Technical Overview and Deployment

## 14.1 Proposed Technology

| **Layer**                                 | **Technology**                                                  | **Purpose**                                                       |
|-------------------------------------------|-----------------------------------------------------------------|-------------------------------------------------------------------|
| **Web application**                       | Next.js, React, TypeScript                                      | Screens, forms, tables, dashboards.                               |
| **Server application**                    | NestJS (Node.js, TypeScript)                                    | Business rules and the API.                                       |
| **Database**                              | PostgreSQL with Prisma                                          | Records, flexible fields, plant separation.                       |
| **Login**                                 | Keycloak                                                        | Single sign-on, roles, two-step verification.                     |
| **<mark>Live status</mark>** | <mark>Redis and WebSockets</mark>                  | <mark>Current device status and live screens.</mark> |
| **Background jobs**                       | BullMQ                                                          | Alerts and scheduled reports.                                     |
| **File storage**                          | S3-compatible store (MinIO or alternative, after licence check) | Documents and labels.                                             |
| **Packaging and web server**              | Docker and NGINX                                                | Same setup in every environment.                                  |
| **Build and release**                     | GitHub Actions                                                  | Automatic tests and deployment.                                   |
| **Health monitoring**                     | Prometheus, Grafana and central logs                            | Health of the system itself.                                      |

## 14.2 Hosting and Deployment

- The system will run on FCCL-owned servers \[on-premises or cloud to be confirmed\].

- Three environments: development, test and production, kept separate.

- Deployment is done from packaged images. If servers cannot reach the internet, packages are carried across and loaded offline, or a private registry is used.

- FCCL IT provides the web address, HTTPS certificate, firewall rules, email access and backup storage.

- Before go-live: full test on the test server, a successful backup restore, and a written rollback plan.

- After go-live: handover documents and training for FCCL IT, and a named support owner \[to be named\].

# 15. Assumptions, Constraints, Dependencies and Risks

## 15.1 Assumptions

- FCCL owns hosting and production and will provide servers and network access.

- Four plants and head office will use the system.

- Costs are in PKR and the interface is in English.

## 15.2 Constraints

- A four-week Phase 1 baseline with four developers limits the first release to core features.

- FCCL security and change rules apply to servers and network changes.

## 15.3 Dependencies

- Sample data: asset lists, employee export, vendor list.

- Servers, certificates and firewall access from FCCL IT.

- Named product owner and testers at the pilot plant.

- Decisions listed in section 18.

## 15.4 Risks

| **Risk**                                          | **Impact**                                                 | **How we reduce it**                                        |
|---------------------------------------------------|------------------------------------------------------------|-------------------------------------------------------------|
| **Existing data is poor or incomplete.**          | Slow import, low trust.                                    | Clean before import and verify on site with QR labels.      |
| **Key decisions arrive late.**                    | Delays and rework.                                         | Use the open issues log with owners and dates.              |
| **Server access or firewall approvals are slow.** | Late deployment.                                           | Request environments before Week 1.                         |
| **Too much scope for the time.**                  | Poor quality at launch.                                    | Phase the delivery and use a shared backlog.                |
| **Plant data is exposed across plants.**          | Serious security issue.                                    | Database-level separation and automated tests.              |
| **Low user adoption.**                            | Records go stale.                                          | Train users, involve plant staff early, retire old methods. |
| **<mark>Data Entry</mark>**          | Data entry from scratch is slow and error-prone            |                                                             |
| **<mark>Shared Logins</mark>**       | Reduces Accountability, everything depends on System Admin |                                                             |

# 16. Deliverables

## 16.1 Overview

This section lists what the project team will hand over to FCCL. A deliverable is complete when it meets the acceptance criteria in section 17 and the product owner accepts it in writing .

## 16.2 Deliverables List

<table>
<colgroup>
<col style="width: 8%" />
<col style="width: 20%" />
<col style="width: 32%" />
<col style="width: 11%" />
<col style="width: 26%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>ID</strong></th>
<th><strong>Deliverables</strong></th>
<th><strong>What FCCL Receives?</strong></th>
<th><strong>Phase</strong></th>
<th><strong>Accepted When?</strong></th>
</tr>
<tr class="odd">
<th><strong>D-01</strong></th>
<th>Requirements Specification</th>
<th>This document, reviewed and signed by FCCL.</th>
<th>Before Build</th>
<th><mark>Signed in Section 19.</mark></th>
</tr>
<tr class="header">
<th><strong>D-02</strong></th>
<th>System Design</th>
<th>Architecture, database design, screen designs and plant separation design.</th>
<th>Before Build</th>
<th><mark>Reviewed by FCCL IT and the product owner.</mark></th>
</tr>
<tr class="odd">
<th><strong>D-03</strong></th>
<th>Web Application</th>
<th>The browser-based system covers the modules in section 5.2.</th>
<th>1 and 2</th>
<th><mark>AC-01 to AC-11 met.</mark></th>
</tr>
<tr class="header">
<th><strong>D-04</strong></th>
<th>Server Application &amp; Database</th>
<th>The API, business rules and database, with plant separation, audit trail and flexible asset fields.</th>
<th>1 and 2</th>
<th><mark>AC-02 to AC-09 met.</mark></th>
</tr>
<tr class="odd">
<th><strong>D-05</strong></th>
<th><mark>Device Status Collector</mark></th>
<th>A small service at each plant that checks devices over the network (ping, SNMP) and reads hardware data from tools FCCL already uses. Nothing is installed on PCs.</th>
<th>[1 or 2]</th>
<th><mark>Devices show Online, Offline or Unknown as agreed [add acceptance criterion].</mark></th>
</tr>
<tr class="header">
<th><strong>D-06</strong></th>
<th><p>Import Tools</p>
<p>&amp; Templates</p></th>
<th>Excel and CSV templates, row checks and error reports.</th>
<th>1</th>
<th>AC-03 met.</th>
</tr>
<tr class="odd">
<th><strong>D-07</strong></th>
<th>Initial Data Entry by System Admin</th>
<th>Cleaned asset, employee, vendor and stock data loaded into the system, pilot plant first.</th>
<th>1 and 2</th>
<th><mark>Verified on-site with QR Labels. (AC-08)</mark></th>
</tr>
<tr class="header">
<th><strong>D-08</strong></th>
<th>QR Labels &amp; Gate pass Layouts</th>
<th>Printable label and gate pass formats approved by FCCL.</th>
<th>1</th>
<th><mark>AC-05 to AC-08 met.</mark></th>
</tr>
<tr class="odd">
<th><strong>D-09</strong></th>
<th>Reports &amp; Dashboard</th>
<th>The dashboard and the reports listed in <mark>section 13</mark>.</th>
<th>1 and 2</th>
<th><mark>Reports match the agreed list [add acceptance criterion].</mark></th>
</tr>
<tr class="header">
<th><strong>D-10</strong></th>
<th>Test Records</th>
<th>Test plan, test cases and results, security review report, restore test record, and the independent security test report before rollout beyond the pilot.</th>
<th>1 and 2</th>
<th>No open critical Defects</th>
</tr>
<tr class="odd">
<th><strong>D-11</strong></th>
<th>Deployed System</th>
<th>Test and production environments on FCCL servers with HTTPS, monitoring and a rollback plan.</th>
<th>1</th>
<th><mark>System running on FCCL servers.</mark></th>
</tr>
<tr class="header">
<th><strong>D-12</strong></th>
<th>Backup &amp; Recovery Setup</th>
<th>Daily backups, written recovery steps and a successful restore test.</th>
<th>1</th>
<th><mark>AC-10 met</mark></th>
</tr>
<tr class="odd">
<th><strong>D-13</strong></th>
<th>User guides</th>
<th>A guide for each role and quick reference sheets.</th>
<th>1 and 2</th>
<th>Reviewed by plant Administrator</th>
</tr>
<tr class="header">
<th><strong>D-14</strong></th>
<th>Technical Documents</th>
<th>Installation guide, configuration guide, API documents, system diagrams and troubleshooting guide.</th>
<th>1 and 2</th>
<th>Reviewed by FCCL IT</th>
</tr>
<tr class="odd">
<th><strong>D-15</strong></th>
<th>Training</th>
<th>Training sessions, training material and attendance record.</th>
<th>1 and 2</th>
<th><mark>[Numbers] sessions held</mark></th>
</tr>
<tr class="header">
<th><strong>D-16</strong></th>
<th>Source code &amp; Handover pack</th>
<th>Source code, build and deployment scripts, settings (without passwords), list of software and licences, and account list.</th>
<th>1 and 2</th>
<th><mark>Handover checklist signed</mark></th>
</tr>
<tr class="odd">
<th><strong>D-17</strong></th>
<th>Rollout to other plants</th>
<th>Go-live at the remaining three plants with data, training and support.</th>
<th>2</th>
<th><mark>Each plant is signs off</mark></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 16.3 Handover and Acceptance

1.  Each deliverable is sent to the product owner for review.

2.  The product owner accepts it or sends written comments within \[5\] working days.

3.  Problems found are rated Critical, High, Medium or Low. Critical and High problems must be fixed before acceptance. Medium and Low problems are fixed by an agreed date.

4.  Final handover happens when all documents, source code and training are delivered and a support owner is named.

## 16.4 Not Included

- Servers, network equipment, certificates and software licences <mark>(FCCL provides them)</mark>.

- Installing software on users’ PCs.

- Changes to SAP or the employee management system.

- Non-IT assets such as furniture and vehicles <mark>\[confirm\]</mark>.

- A mobile app. The web system works in phone browsers.

- Typing old records by hand. FCCL provides files for import <mark>\[confirm\].</mark>

| **Phase**                           | **Duration**           | **Main deliverables**                                                                                                                                | **Exit criteria**                                   |
|-------------------------------------|------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| **Readiness**                       | Before Week 1          | Decisions confirmed, environments ready, sample data received.                                                                                       | Open issues for Phase 1 closed.                     |
| **Phase 1: pilot**                  | \[4 weeks\] baseline   | Login and plant separation, assets, assignment, employee import, basic monitoring, QR labels, work orders, audit trail, backups, pilot at one plant. | Phase 1 acceptance criteria met and UAT signed off. |
| **Phase 2: completion and rollout** | \[4 weeks\] indicative | Rack view, cable mapping, stock and licences, poller hardening, security test, reports, rollout to other three plants.                               | The security test passed and each plant signed off. |
| **Support**                         | \[Period\]             | Monitoring, fixes, user support, small improvements.                                                                                                 | Handover to FCCL support owner.                     |

# 17. Acceptance Criteria and Testing

| **ID**    | **Area**         | **Acceptance criterion**                                                                | **How tested**                   |
|-----------|------------------|-----------------------------------------------------------------------------------------|----------------------------------|
| **AC-01** | Access           | Users sign in with role logins. Administrators must use two-step verification.          | Demonstration                    |
| **AC-02** | Plant separation | A Plant A user cannot see or change Plant B data for any role.                          | Automated tests and manual check |
| **AC-03** | Assets           | Assets can be created, searched, edited, imported and exported. Duplicates are blocked. | UAT                              |
| **AC-04** | Assignment       | Assign, transfer and return keep history. Assets held by a leaver are listed.           | UAT                              |
| **AC-05** | Movement         | A transfer and gate pass go through request, approval, dispatch and receipt.            | UAT                              |
| **AC-06** | Work orders      | A work order moves through all statuses and updates the asset status.                   | UAT                              |
| **AC-07** | Alerts           | Warranty and stock alerts reach the right roles.                                        | Test with sample data            |
| **AC-08** | QR audit         | A label scan confirms an asset and a difference becomes a finding.                      | On-site test                     |
| **AC-09** | Audit trail      | Actions are recorded and entries cannot be edited or deleted.                           | Security test                    |
| **AC-10** | Backup           | A backup can be restored on a test machine.                                             | Restore test                     |
| **AC-11** | Performance      | Search and lists meet NFR-001 at planning size.                                         | Load test                        |

Testing includes unit and integration tests, plant separation tests for every role, end-to-end tests of key workflows, security tests, connectivity tests for monitoring, and UAT with real users before pilot sign-off.

# 18. Open Issues and Decisions

| **ID**    | **Issue**                                                                         | **Needed from**    | **Needed by**                           | **Status** |
|-----------|-----------------------------------------------------------------------------------|--------------------|-----------------------------------------|------------|
| **OI-05** | On-premises or cloud hosting, server size, and certificate and secret management. | FCCL IT            | Before Design starts                    | **Open**   |
| **OI-06** | Notification channels (email, SMS, WhatsApp, Teams) and escalation.               | Management         | Before <mark>Week 3</mark> | **Open**   |
| **OI-07** | Asset tag format.                                                                 | Product owner      | Before <mark>Week 2</mark> | **Open**   |
| **OI-08** | Inventory size, concurrent users, retention rules, recovery targets.              | Plant coordinators | Before Design starts                    | **Open**   |
| **OI-09** | Is gate pass in Phase 1 and who checks it at the gate?                            | Management         | Before <mark>Week 2</mark> | **Open**   |
| **OI-10** | Named product owner, security reviewer and support owner.                         | Project sponsor    | Before Design starts                    | **Open**   |
| **OI-11** | Timing of the independent security test.                                          | FCCL IT            | Before <mark>Week 4</mark> | **Open**   |

# 19. Approval and Sign-off

By signing, the approvers confirm that these requirements describe what FCCL needs. Changes after approval follow a change control process agreed by the sponsor and project lead.

| **Name** | **Role**          | **Signature** | **Date** |
|----------|-------------------|---------------|----------|
| \[Name\] | Project Sponsor   |               |          |
| \[Name\] | Product Owner     |               |          |
| \[Name\] | FCCL IT Head      |               |          |
| \[Name\] | Security Reviewer |               |          |
| \[Name\] | Project Lead      |               |          |

# Appendix A. Questionnaire Response Log

Record each answer here as it is received. The requirement IDs show where the answer was used.

| **Question**                            | **Answer received** | **Given by** | **Date** |
|-----------------------------------------|---------------------|--------------|----------|
| Gen Q1: Head office only or all plants? | All plants          | \[Name\]     | \[Date\] |
| Gen Q22: How do staff sign in today?    | Using EMS           | \[Name\]     | \[Date\] |
| AST Q7: Tag format?                     | EQP:001             | \[Name\]     | \[Date\] |
| WO Q2: Who approves work orders?        | System Admin        | \[Name\]     | \[Date\] |
| MOV Q5: Who approves inter-plant moves? | System Admin        | \[Name\]     | \[Date\] |

# Appendix B. Role and Module Access Matrix

F = full (add, edit, approve), L = limited, V = view only, O = own records only, A = approve, dash = no access. Confirm with FCCL

| **Module**                   | **System Admin** | **Plant Admin** | **Auditor**  | **Employee** |
|------------------------------|------------------|-----------------|--------------|--------------|
| **Asset Records**            | F (all plants)   | F (own plant)   | V            | O            |
| **Employee Records**         | F                | F               | V            | O            |
| **Asset Assignment**         | F                | F               | V            | O (confirm)  |
| **Gate Pass and Movement**   | A                | F               | V            | \-           |
| **Work Orders**              | F                | F               | V            | Request      |
| **Stock and Spare Parts**    | F                | F               | V            | \-           |
| **Vendors and Contracts**    | F                | F               | V            | \-           |
| **Physical Audit**           | F                | F               | F (findings) | \-           |
| **Import and Export**        | F                | F (own plant)   | V            | \-           |
| **Reports and Dashboard**    | F                | F (own plant)   | V            | \-           |
| **Audit Trail**              | V (all)          | V (own plant)   | V            | \-           |
| **Settings and Asset Types** | F                | \-              | \-           | \-           |
| **Users and Roles**          | F                | L (plant users) | \-           | \-           |

---

**SIGNATURES**

| **Project Supervisor** | **Developer** |
|---|---|
| Signature: ______________________________ | Signature: ______________________________ |
| Name: __________________________________ | Name: __________________________________ |
| Date: ___________________________________ | Date: ___________________________________ |
