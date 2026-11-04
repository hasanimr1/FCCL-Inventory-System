# Backup, Deployment and Recovery

## 1. Development and deployment direction
Develop the application locally on the developer's laptop first. After approval and testing, transfer the application to an FCCL-controlled server/environment. Production hosting and network access must be coordinated with FCCL IT. The deployed stack is defined in [[02-architecture-and-technology]]; unresolved hosting questions are tracked in [[08-decisions-and-open-issues#8. Open backup and deployment decisions]].

## 2. Environments
The requirements specification proposes separate:
- Development.
- Test.
- Production.

Keep the environments separate. Do not allow test data or test scripts to overwrite production records. Production secrets must not be committed to source control.

## 3. Deployment preparation
Before production deployment:
- Confirm target server and operating environment.
- Confirm MSSQL Server version/edition and connectivity.
- Configure application hosting.
- Confirm web address and HTTPS certificate.
- Confirm firewall and network rules.
- Confirm secret/configuration management.
- Confirm email access if email notifications are enabled.
- Confirm backup storage.
- Test deployment in the test environment.
- Perform a successful database restore test.
- Prepare a written rollback plan.

After deployment:
- Provide installation and deployment instructions.
- Provide database backup and recovery instructions.
- Provide administrator and user guidance.
- Hand over to FCCL IT.
- Identify the support owner.

## 4. Backup strategy discussed

The following was recommended as a starting point for a SQL Server system. It is not yet an FCCL-approved schedule.

### Database backups
- Full database backup every night.
- Differential backup every six hours.
- Transaction-log backup every 15–30 minutes if SQL Server Full recovery model is configured and point-in-time recovery is required.

Final frequency depends on FCCL-approved RPO, RTO, database size, workload and infrastructure.

### Backup locations
Do not keep the only backup on the same machine or disk as the production database.

Proposed layers:
- Separate backup server or NAS.
- Additional off-site or organization-approved cloud copy, subject to FCCL policy and data residency.
- Offline or immutable copy to reduce ransomware risk.

### 3-2-1 principle
- Keep at least three copies of important data.
- Use at least two different storage types.
- Keep at least one copy off-site or isolated from production.

The storage media and locations require FCCL approval.

### Other items to back up
- Uploaded documents and attachments.
- Asset photos and supporting files.
- Application configuration required for recovery.
- Database schema and migrations.
- Deployment scripts and release artifacts.
- Required certificates or configuration references, protected securely.

Secrets, signing keys and passwords must be protected separately and must not be stored in plain text in repositories or ordinary documentation.

### Verification and restore testing
- Monitor backup jobs and failures.
- Verify backup files.
- Perform regular restore tests in a separate environment.
- Document the restore process.
- Record restore-test date, duration and outcome.
- Check restored data and uploaded files for consistency.
- Test the full application after restoration.

A backup that has never been successfully restored is not a proven recovery plan.

### SQL Server Express note
SQL Server Express does not include SQL Server Agent. If Express is used, scheduled backups may require Windows Task Scheduler or another FCCL-approved scheduler. Confirm the edition before designing automation.

## 5. RPO and RTO
- RPO is the acceptable data-loss period.
- RTO is the acceptable time to restore service.

Neither value has been finalized. They determine backup frequency, storage and recovery procedures.

## 6. Questions for FCCL IT
1. Which SQL Server edition and version will be used?
2. Where will the production database be hosted?
3. Is a backup server or NAS available?
4. Is off-site backup storage approved?
5. Is immutable/offline backup storage available?
6. What retention period is required?
7. What RPO is acceptable?
8. What RTO is acceptable?
9. Who monitors backups and performs restore tests?
10. What is the approved local-to-organization deployment process?

## Related notes
- [[02-architecture-and-technology]] — MSSQL, EF Core and the deployment target.
- [[08-decisions-and-open-issues#8. Open backup and deployment decisions]] — the same questions, tracked as decisions.
- [[01-project-overview]] — deployment is the final step of the delivery approach.
- [[Asset_Management_Requirements_Specification]] — the original hosting and deployment section.
- [[Inital Plan]] — an earlier Windows Server / IIS deployment blueprint.
