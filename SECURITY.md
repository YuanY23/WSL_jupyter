# Security policy

## Supported version

Security fixes are evaluated for the current `main` branch and the latest
documented deployment configuration.

## Reporting a vulnerability

Please do not disclose vulnerabilities, credentials, student data, internal
network addresses, or deployment details in a public issue.

Use GitHub's **Report a vulnerability** flow for this repository when it is
available. If private vulnerability reporting is unavailable, open a public
issue containing only a short request for a private reporting channel; do not
include technical details until a private channel has been established.

## Deployment note

The repository contains reference and development configuration. Before a
production deployment, operators must review authentication, password policy,
network exposure, container privileges, secret storage, persistent volumes,
and course-data access for their own environment.
