---
id: first-login-sso
title: First-Time Studio Login
persona: FSA
last-reviewed: 2026-04-28
---

# Flow: First-Time Studio Login (`first-login-sso`)

## Goal

Enable a new user to successfully log into Studio for the first time using SSO authentication and complete initial setup tasks.

## Scope

**Included**

- Initial SSO authentication flow
- User identity verification
- Basic profile setup
- Initial permission assignment
- Welcome experience configuration

**Excluded**

- Password reset flows
- Multi-factor authentication setup
- Advanced profile customization
- Team/organization assignment beyond initial access

> **A note on labels, tags, and signal names** throughout this spec: where the document names a specific signal, the **behavior** is what the spec prescribes; any cited label strings are illustrative examples. Equivalent names chosen during design are acceptable so long as the behavior is preserved.

## Preconditions

- User has been invited to the system
- SSO provider is configured and accessible
- User has a valid email address in the organization
- System is in a state where new user registration is allowed

## Trigger

- User navigates to the Studio login page and initiates SSO login

## Primary actor

- First-time Studio user

## Inputs

- User's email address
- SSO provider credentials
- Organization membership verification
- Initial role/permission assignments from invitation

## Outputs

- Authenticated user session
- Basic user profile
- Initial permission set
- Completed welcome setup status

## Success outcome

- User is authenticated and has completed initial setup tasks
- User profile contains required basic information
- User has appropriate initial permissions
- User can access main Studio interface

## Terminal outcomes

- **Success** — User completes SSO authentication and initial setup
- **Authentication failed** — SSO provider rejects credentials or user is not in organization
- **User abandoned** — User leaves during the process
- **System blocked** — System configuration prevents new user registration

## Main flow

1. User navigates to Studio login page
2. User selects SSO login option
3. System redirects to SSO provider
4. User authenticates with SSO provider
5. SSO provider returns authentication response
6. System verifies user identity and organization membership
7. System creates basic user profile
8. System assigns initial permissions
9. System presents welcome/setup experience
10. User completes initial profile setup
11. System grants access to main Studio interface

## Alternate flows

### A1. User Not in Organization

1. SSO provider authenticates user but indicates they are not in the organization
2. System displays appropriate error message
3. User is redirected to contact administrator

## Failure cases

### F1. SSO Provider Unreachable

- Trigger: SSO provider is temporarily unavailable
- Response: Display error message and offer retry option
- Final state: User cannot proceed with login

### F2. User Already Exists

- Trigger: Authenticated user already has an account
- Response: Redirect to standard login flow
- Final state: User proceeds with existing account

## State transitions

- Unauthenticated → Authenticated on successful SSO verification
- New user setup incomplete → Setup complete after profile creation
- Guest access → Standard user access after permission assignment

## Business rules

- **Email domain validation** — User must have email from approved organization domains
- **Initial role assignment** — New users receive "FSA" role by default
- **Profile completion requirement** — Basic profile information must be provided
- **Session timeout** — Authentication session expires after 15 minutes of inactivity

## Invariants

- **SSO-only authentication** — System does not support password-based authentication for initial login
- **Organization membership** — All users must belong to the organization
- **Profile uniqueness** — Email address must be unique across all users
- **Audit trail** — All authentication attempts are logged

## Events / observability

- **Authentication events** — SSO login attempts must be observable
- **User creation events** — New user profile creation must be tracked
- **Permission assignment events** — Initial role assignments must be logged
- **Setup completion events** — User setup progress must be observable

## Open questions

1. `[product]` **What specific profile information is required during initial setup?** — Need to define minimum required fields
2. `[design]` **What is the exact UI flow for the welcome experience?** — Need design mockups for the initial setup screens