# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

If you discover a security issue in this project, please report it privately:

1. Go to the **Security** tab of this repository.
2. Click **"Report a vulnerability"**.
3. Fill in the details and submit.

We will acknowledge your report within 48 hours and aim to release a fix within 7 days for critical issues.

## Scope

- Credential leaks (e.g., secrets committed to the repository)
- Remote code execution via RSS feed parsing
- Authentication bypass in bot account management

## Out of scope

- Rate-limiting behavior of third-party RSS/GitHub APIs
- Availability of external services monitored by the bots
