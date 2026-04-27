## ADDED Requirements

### Requirement: Public portfolio URL
The system SHALL expose a public URL of the form `/u/:handle` that resolves to the portfolio owned by the account with that handle.

#### Scenario: Visitor opens a published portfolio
- **WHEN** a visitor (authenticated or not) requests `/u/:handle` for a handle whose owner has `published = true`
- **THEN** the system loads that portfolio, fetches its images in the owner's specified order, and renders them via the portfolio's selected template

#### Scenario: Handle does not exist
- **WHEN** a visitor requests `/u/:handle` for a handle that does not match any account
- **THEN** the system renders a "portfolio not found" page and returns to the visitor without leaking whether the handle ever existed

#### Scenario: Portfolio is unpublished
- **WHEN** a non-owner visitor requests `/u/:handle` for a handle whose owner has `published = false`
- **THEN** the system renders the same "portfolio not found" page as for non-existent handles

#### Scenario: Owner views their own unpublished portfolio
- **WHEN** the owner of an unpublished portfolio is authenticated and requests `/u/:handle` with their own handle
- **THEN** the system renders the portfolio with a clearly visible "unpublished — only you can see this" indicator

### Requirement: Public render uses the owner's selected template
The system SHALL render the public portfolio through whichever template the owner has selected at the time of the request.

#### Scenario: Owner switches templates and a visitor reloads
- **WHEN** the owner changes the selected template and a visitor subsequently reloads `/u/:handle`
- **THEN** the system renders the portfolio through the newly selected template

### Requirement: Public render is read-only
The system SHALL ensure the public portfolio view exposes no controls that mutate portfolio state.

#### Scenario: Visitor inspects the public page
- **WHEN** any visitor (including the owner) loads `/u/:handle`
- **THEN** the rendered page exposes only navigation, viewing, and sharing affordances and offers no upload, edit, delete, reorder, template-switch, or publish controls

### Requirement: Empty portfolio handling
The system SHALL render a coherent public page even when the portfolio has zero images.

#### Scenario: Published portfolio with no images
- **WHEN** a visitor opens a published portfolio that has no images
- **THEN** the system renders the portfolio's title and bio and shows an empty-state message in place of the image area instead of failing
