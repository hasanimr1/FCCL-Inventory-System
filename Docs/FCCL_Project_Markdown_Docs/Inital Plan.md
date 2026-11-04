# Enterprise IT Hardware Inventory System: Master Project & Deployment Blueprint

> [!warning] Earlier blueprint
> This note is an earlier architecture and deployment plan. Parts of it are superseded: it proposes Node.js/NestJS and a 4-developer roadmap, while the current backend is ASP.NET Core + C# and the current role model has four roles. Treat the topology and IIS/MSSQL guidance as reference material only. Current stack: [[02-architecture-and-technology]]. Current roles: [[03-roles-and-access-control]]. Decision log: [[08-decisions-and-open-issues]].

---

## 1. System Architecture, Tech Stack & 4-Developer Team Roadmap

### 1.1 Core Architectural Concept
To accommodate both standard infrastructure hardware (Servers, Switches, Racks, Cables) and arbitrary future equipment, the database architecture follows a hybrid design:
* **Core Relations:** `Location` (Site/Room) $\rightarrow$ `Rack` (U-height, capacity) $\rightarrow$ `Asset` (Parent/Child slots, e.g., Blade inside Chassis).
* **Universal Columns:** `asset_tag`, `serial_number`, `model`, `vendor`, `status` (In Use, Spare, Repair, Decommissioned), `assigned_to`, `location_id`, `rack_id`, `rack_unit_start`.
* **Extensibility:** An `AssetType` schema builder combined with structured relational tables and custom field attributes, allowing runtime addition of new equipment specs without rewriting database structures.
* **Port-to-Port Relations:** A dedicated `PortConnection` table to map physical and network links (e.g., Switch Port A $\leftrightarrow$ Server NIC 1 via Cable X).

### 1.2 Recommended Technology Stack
* **Backend:** Node.js / NestJS (TypeScript) or .NET Core (C#).
* **Database:** Microsoft SQL Server (MSSQL).
* **ORM / Query Layer:** Prisma ORM, TypeORM, or Entity Framework Core.
* **Frontend:** React / Next.js (TypeScript) styled with Tailwind CSS and shadcn/ui.
* **Data Grids:** TanStack Table (React Table) for sorting, multi-filtering, column reordering, and virtualization.
* **Rack Visualization:** HTML5 Canvas / SVG (Konva.js or D3.js) for interactive 42U/48U rack elevation diagrams.
* **Authentication:** JWT with Role-Based Access Control (Admin, Technician, Auditor/Viewer).

### 1.3 Work Division Across 4 Developers

#### Developer 1: Lead Backend & Data Architect
* Designs the MSSQL database schema (Assets, Locations, Ports, Lifecycles, Audit Logs).
* Develops the Dynamic Custom Attribute Engine (enables admins to define fields for new device types on the fly).
* Implements Authentication, RBAC (Role-Based Access Control), and session security.
* Configures automated backend builds, error handling, and pipeline setups.

#### Developer 2: Backend Integration & Reporting Engineer
* Develops Rack capacity and collision-detection algorithms (verifying available U-slots).
* Implements Port-to-Port and Cable mapping business logic.
* Builds bulk Excel/CSV import and export pipelines with validation.
* Implements automated Barcode/QR generation engines (SVG/PDF export) and system-wide audit logging.

#### Developer 3: Frontend Lead / UI & Visualization Specialist
* Configures the frontend application shell, routing, state management, and base layouts.
* Builds the Interactive Graphical Rack Elevation component (visual 42U/48U rack showing occupied/free slots, front/back mounting, and device metrics).
* Develops the dynamic form generator (renders inputs dynamically depending on whether an asset is a Switch, Server, or Printer).
* Implements executive dashboards (lifecycle distribution, capacity metrics, upcoming warranty expirations).

#### Developer 4: Frontend & Mobile/Audit Specialist
* Builds enterprise-grade asset data tables (multi-faceted filters, instant search, batch updates).
* Integrates an in-browser camera-based QR/Barcode scanning module (using `html5-qrcode`) for mobile tablet audits.
* Builds the Asset Detail Views (spec sheets, port maps, attached peripherals, change history).
* Builds Management screens for Vendors, Locations, and System Users.

### 1.4 Development Roadmap (8-Week Execution)
* **Phase 1 (Weeks 1–2): Architecture & Foundations** — DB schemas initialized, authentication/RBAC operational, app shells ready.
* **Phase 2 (Weeks 3–4): Core Asset Engine** — Dynamic attribute engine completed, high-density data tables and bulk CSV import functional.
* **Phase 3 (Weeks 5–6): Racks, Connections & QR** — Visual rack elevation interface operational, port-to-port cable relationships mapped, QR printouts generated.
* **Phase 4 (Weeks 7–8): Auditing, Mobile Scanner & Production Hardening** — Camera-based scanning audit workflow completed, error logging formalized, end-to-end testing signed off.

---

## 2. Technical Primer: Understanding Rack Units ("U")

* **Definition:** "U" stands for **Rack Unit** (often called **RU**), the international standard for vertical height in server racks (EIA-310 standard).
* **Exact Dimensions:** 
  $$\mathbf{1U = 1.75\text{ inches} = 44.45\text{ mm}}$$
* **Interpreting "U10–U12":**
  * The equipment is mounted starting at **Unit 10** and ends at **Unit 12**.
  * The device occupies **3 Units in total** (U10, U11, U12).
  * Total height = $3 \times 1.75\text{ in} = 5.25\text{ inches}\ (\approx 13.3\text{ cm})$.
* **Standard Hardware Sizes:**
  * **1U:** Network switches, patch panels, 1U rack servers (e.g., Dell PowerEdge R340).
  * **2U:** Standard enterprise computing servers (e.g., Dell R740, HP ProLiant DL380).
  * **4U:** High-density enterprise storage arrays, GPU computation nodes, battery UPS units.
  * **42U / 48U:** Standard heights of full-size data center rack enclosures.
* **Database Representation:**
  Every rack stores `total_units` (e.g., `42`). Every placed device stores `rack_unit_start` (integer) and `rack_height` (integer), allowing the system to track occupied units and prevent slot collisions.

---

## 3. Deployment Strategy: Secure, Air-Gapped Internal Environments

To deploy the system in an organization without exposing it to the public internet:

### 3.1 Network Isolation Architecture
* **No Public IP & No Port Forwarding:** The server is assigned a strictly private internal IP (e.g., `10.20.1.50`). Border firewalls drop all external inbound internet traffic.
* **Access Boundary:** Accessible only via the local corporate LAN or through an authorized internal VPN (WireGuard, IPsec, OpenVPN).
* **Database Isolation:** Database ports are restricted from external subnets, accepting connections exclusively from the application server.
* **Internal Encryption:** Internal SSL/TLS certificates issued by the organization’s Private Certificate Authority (Active Directory Certificate Services) encrypt traffic on Port 443 (HTTPS).

### 3.2 Update & Maintenance Protocols
* **Air-Gapped Patches:** Updates are delivered via compiled binary archives.
* **Automated Local Backups:** Scheduled database backups (`pg_dump` or MSSQL Maintenance Plans) save snapshots directly to internal Network Attached Storage (NAS) or backup tape infrastructure.

---

## 4. Native Windows Server Deployment (No Docker, Existing MSSQL)

When deploying on a corporate **Windows Server** natively without container runtimes, utilizing an **already existing MSSQL Server**:

### 4.1 System Topology
```
[User Browser]
      │  (HTTPS 443 / HTTP 80)
      ▼
┌──────────────── Windows Application Server ────────────────┐
│                                                            │
│   IIS (Internet Information Services)                      │
│   ├── Serves Static Frontend: C:\inetpub\inventory\frontend│
│   └── Reverse Proxy (/api/*) via ARR & URL Rewrite         │
│            │                                               │
│            ▼ (Internal localhost:5000)                     │
│   Node.js Backend (Windows Service via NSSM)               │
│   Folder: C:\inetpub\inventory\backend                     │
│            │                                               │
└────────────┼───────────────────────────────────────────────┘
             │  (TCP Port 1433)
             ▼
┌──────────────── Existing Database Server ──────────────────┐
│   Microsoft SQL Server (MSSQL)                             │
│   Database: [IT_Inventory_DB]                              │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Software Prerequisites to Install on the Windows App Server
1. **Web Server (IIS):** Installed via *Server Manager $\rightarrow$ Add Roles and Features*.
2. **IIS URL Rewrite Module 2.1:** Handles client-side Single-Page Application (SPA) routing.
3. **IIS Application Request Routing (ARR 3.0):** Powers the reverse proxy routing from IIS to the backend.
4. **Node.js LTS (v20 or v22):** The runtime environment for the application backend.
5. **NSSM (Non-Sucking Service Manager):** Registers and manages the backend as a persistent background Windows Service.

### 4.3 Step-by-Step Installation & Configuration Guide

#### Step 1: Configure IIS and Application Request Routing
1. Enable **Web Server (IIS)** in Server Manager.
2. Install **URL Rewrite 2.1** and **ARR 3.0**.
3. Open **IIS Manager** $\rightarrow$ Click the root Server node $\rightarrow$ Open **Application Request Routing Cache** $\rightarrow$ Click **Server Proxy Settings** in the right actions pane $\rightarrow$ Check **Enable proxy** $\rightarrow$ Click **Apply**.

#### Step 2: Establish Application Folders
Create the production file tree on the host disk:
```text
C:\inetpub\inventory\
├── frontend\    <-- Paste compiled React production build files here
└── backend\     <-- Paste compiled Node.js backend files and .env here
```

#### Step 3: Register Backend as a Persistent Windows Service
Using NSSM prevents the backend from closing when administrators disconnect from Remote Desktop:
1. Open PowerShell or Command Prompt as **Administrator**.
2. Run:
   ```cmd
   nssm install InventoryBackendService
   ```
3. Set the fields in the configuration window:
   * **Path:** `C:\Program Files\nodejs\node.exe`
   * **Startup directory:** `C:\inetpub\inventory\backend`
   * **Arguments:** `dist/main.js` (or entry point file)
4. Click **Install Service**.
5. Start the service:
   ```cmd
   nssm start InventoryBackendService
   ```

#### Step 4: Configure `web.config` for IIS Reverse Proxy & Routing
Save the following configuration as `C:\inetpub\inventory\frontend\web.config`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- 1. Proxy API calls to Node.js running internally on port 5000 -->
        <rule name="ReverseProxyToBackend" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:5000/api/{R:1}" />
        </rule>

        <!-- 2. Prevent 404s on browser reload by routing non-file traffic to index.html -->
        <rule name="ReactRoutes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

#### Step 5: Bind IIS Site
1. In IIS Manager, right-click **Sites** $\rightarrow$ **Add Website**.
2. **Site Name:** `IT-Inventory`
3. **Physical Path:** `C:\inetpub\inventory\frontend`
4. **Binding:** Port `80` (HTTP) or Port `443` (HTTPS) bound to the server's internal SSL certificate.

---

## 5. Development & Deployment Without Direct Database Access

In corporate setups adhering to strict **Separation of Duties**, developers are blocked from accessing production databases. The project can be developed, tested, and deployed entirely blind using this workflow:

### 5.1 Local Development Environment
* Developers install the free **Microsoft SQL Server Developer Edition** or **MSSQL Express** locally.
* All development, relationships, triggers, and mock data tests run against this isolated local instance.

### 5.2 Schema Handover via Structured SQL Migration Scripts
Rather than having direct access, developers produce clear, verifiable scripts for the client's Database Administrator (DBA):
1. **`01_schema_v1.0.sql`:** Contains all standard DDL statements (`CREATE TABLE`, `ALTER TABLE`, foreign keys, clustered/non-clustered indexes).
2. **`02_initial_seed.sql`:** Populates necessary lookup data, system defaults (device types, rack sizes), and the default Super Administrator account.
3. The client’s DBA reviews the scripts in SQL Server Management Studio (SSMS) and executes them directly.

### 5.3 Zero-Knowledge Configuration (`.env`)
No production credentials exist in the source code or version control. A blank configuration template is provided:
```env
PORT=5000
DB_SERVER=10.x.x.x
DB_PORT=1433
DB_NAME=IT_Inventory_DB
DB_USER=
DB_PASSWORD=
```
The client sysadmin opens this file on their server, enters the production credentials, and saves it. Alternatively, if Windows Integrated Authentication is used, the backend can authenticate using the identity of the Windows Service account itself without saving any cleartext passwords.

### 5.4 Remote Diagnostics and Troubleshooting
Because developers cannot log in to inspect errors, build internal diagnostics into the codebase:
1. **Database Health Verification Endpoint (`/api/health`):**
   Executes a basic query (`SELECT 1;`). Returns JSON indicating whether the connection to MSSQL is established or surfaces the exact network connection failure error without exposing credentials.
2. **File-Based Logging:**
   Using a logger like **Winston**, system events, network errors, and database exceptions are written directly to `C:\inetpub\inventory\backend\logs\error.log`. In the event of an operational failure, the administrator can send this log file to the developers for analysis.

---

## 6. Official Compatibility Statement & Client Inquiry Form

Use this copy-paste communication to respond to your supervisor or the client's technical team:

> **System Compatibility Confirmation**
>
> **Compatibility Status:** Fully Compatible.
> The software uses a standard, enterprise-ready web architecture designed to integrate directly with internal Windows Server environments and Microsoft SQL Server infrastructure.
>
> **End-User Requirements:** None. The system operates fully inside standard modern web browsers (Microsoft Edge, Google Chrome, Mozilla Firefox).
>
> **Application Server Requirements:**
> * **Operating System:** Windows Server 2016, 2019, or 2022.
> * **Server Roles/Features:** IIS (Internet Information Services), URL Rewrite Module 2.1, Application Request Routing (ARR) 3.0.
> * **Runtimes:** Node.js LTS (v20 or v22), NSSM (Service Manager).
> * **Hardware Baseline:** 4 CPU Cores, 8 GB RAM, 50 GB SSD storage.
>
> **Database Server Requirements (Existing MSSQL):**
> * A blank target database (e.g., `IT_Inventory_DB`).
> * A dedicated SQL Authentication user (or Windows Service Account) granted `db_owner` rights to that database.
> * Internal network clearance allowing communication over TCP Port 1433 from the Application Server to the Database Server.