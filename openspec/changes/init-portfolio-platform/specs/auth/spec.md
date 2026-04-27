## ADDED Requirements

### Requirement: Account signup
The system SHALL allow a visitor to create an account with an email address, a password, and a unique public handle.

#### Scenario: Successful signup
- **WHEN** a visitor submits a signup form with a valid email, a password of at least 8 characters, and an unused handle matching `^[a-z0-9][a-z0-9-]{2,29}$`
- **THEN** the system creates an account, issues a session, and redirects the visitor to the dashboard

#### Scenario: Handle already taken
- **WHEN** a visitor submits a signup form with a handle that another account already uses
- **THEN** the system rejects the submission, displays an inline error on the handle field, and does not create the account

#### Scenario: Invalid email format
- **WHEN** a visitor submits a signup form with an email that fails RFC-5322 validation
- **THEN** the system rejects the submission and displays an inline error on the email field

#### Scenario: Password too short
- **WHEN** a visitor submits a signup form with a password shorter than 8 characters
- **THEN** the system rejects the submission and displays an inline error on the password field

### Requirement: Login with email and password
The system SHALL authenticate returning users by email and password and issue a session.

#### Scenario: Correct credentials
- **WHEN** a visitor submits the login form with credentials matching an existing account
- **THEN** the system issues a session and redirects to the dashboard

#### Scenario: Incorrect credentials
- **WHEN** a visitor submits the login form with credentials that do not match any account
- **THEN** the system displays a generic "invalid email or password" error without revealing which field was wrong

#### Scenario: Already authenticated
- **WHEN** an authenticated user navigates to `/login` or `/signup`
- **THEN** the system redirects them to `/dashboard`

### Requirement: Logout
The system SHALL allow an authenticated user to end their session.

#### Scenario: User logs out
- **WHEN** an authenticated user activates the logout control
- **THEN** the system clears the session and redirects to the public landing page

### Requirement: Protected routes
The system SHALL restrict owner-only routes to authenticated users.

#### Scenario: Unauthenticated access to dashboard
- **WHEN** an unauthenticated visitor requests any path under `/dashboard`
- **THEN** the system redirects to `/login` and preserves the originally requested path so the user returns to it after logging in

#### Scenario: Authenticated access to dashboard
- **WHEN** an authenticated user requests any path under `/dashboard`
- **THEN** the system renders the requested page

### Requirement: Session persistence
The system SHALL persist a user's session across page reloads until explicit logout or session expiry.

#### Scenario: Reload while authenticated
- **WHEN** an authenticated user reloads the page
- **THEN** the system restores the session without re-prompting for credentials and renders the same authenticated state
