# Contributing

Thank you for helping improve the platform. Useful contributions include
deployment feedback, reproducible bug reports, documentation corrections,
teaching scenarios, extension tests, and accessibility or localization
improvements.

## Before opening an issue

1. Check whether the issue concerns a project-specific component or an
   upstream project such as JupyterLab or nbgrader.
2. For project-specific bugs, include the relevant component, JupyterHub/
   JupyterLab versions, deployment method, expected behavior, and a minimal
   reproduction when possible.
3. Remove passwords, API tokens, student work, names, and internal hostnames
   from all public reports.

## Scope and ownership

This repository includes upstream source trees for reproducible integration.
Issues or pull requests that change JupyterLab or nbgrader should clearly
explain why the change belongs in this integration repository instead of the
relevant upstream project.

Changes to project-specific extensions or deployment configuration should
include appropriate tests or a concise manual verification note. Documentation
changes should remain accurate for the currently tracked configuration.

## Pull requests

- Keep each pull request focused on one problem.
- Explain the user or maintainer impact and how the change was verified.
- Do not add generated build output, runtime databases, course data, or
  credentials.
- Preserve existing copyright and license notices.

For vulnerabilities, please follow [SECURITY.md](SECURITY.md) rather than
opening a public issue.
