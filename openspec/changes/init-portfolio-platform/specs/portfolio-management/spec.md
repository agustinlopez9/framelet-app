## ADDED Requirements

### Requirement: Single portfolio per account
The system SHALL provision exactly one portfolio per account at signup time, owned by that account.

#### Scenario: Portfolio exists after signup
- **WHEN** a new account is created
- **THEN** the system creates a corresponding portfolio with the account as owner, the handle copied from the account, an empty image list, the default template selected, and `published = false`

### Requirement: Edit portfolio metadata
The system SHALL allow the owner to edit the portfolio's display title and bio.

#### Scenario: Owner edits title
- **WHEN** the owner submits a new title of 1–80 characters
- **THEN** the system saves the new title and reflects it on subsequent dashboard and public renders

#### Scenario: Owner edits bio
- **WHEN** the owner submits a new bio of up to 500 characters
- **THEN** the system saves the new bio and reflects it on subsequent renders

#### Scenario: Title exceeds limit
- **WHEN** the owner submits a title longer than 80 characters
- **THEN** the system rejects the submission with an inline error and does not save

### Requirement: Upload images
The system SHALL allow the owner to upload image files to their portfolio.

#### Scenario: Successful upload
- **WHEN** the owner selects one or more files of type `image/jpeg`, `image/png`, or `image/webp`, each at most 10MB
- **THEN** the system uploads each file to storage, creates a corresponding image record on the portfolio, and shows the new image in the dashboard list

#### Scenario: Unsupported file type
- **WHEN** the owner selects a file whose MIME type is not `image/jpeg`, `image/png`, or `image/webp`
- **THEN** the system rejects that file before upload, displays an error identifying it, and continues uploading any remaining valid files

#### Scenario: File too large
- **WHEN** the owner selects a file larger than 10MB
- **THEN** the system rejects that file before upload and displays an error identifying it

#### Scenario: Upload progress and cancel
- **WHEN** an upload is in progress
- **THEN** the system displays per-file progress and a cancel control; cancelling aborts the upload and removes the file from the queue without creating an image record

#### Scenario: Network failure mid-upload
- **WHEN** an upload fails due to a network error
- **THEN** the system marks that upload as failed, offers a retry control, and does not create an image record until a retry succeeds

### Requirement: Edit image metadata
The system SHALL allow the owner to edit each image's title, description, and alt text.

#### Scenario: Owner edits image title
- **WHEN** the owner submits a new title of up to 80 characters for an image
- **THEN** the system saves the title and surfaces it to any template that renders titles

#### Scenario: Owner edits alt text
- **WHEN** the owner submits alt text of up to 200 characters for an image
- **THEN** the system saves the alt text and uses it as the `alt` attribute when rendering the image

### Requirement: Reorder images
The system SHALL allow the owner to set the display order of images within their portfolio.

#### Scenario: Owner drags an image to a new position
- **WHEN** the owner drags an image to a new position in the dashboard image list and releases
- **THEN** the system persists the new order and templates render images in that order on subsequent loads

### Requirement: Delete images
The system SHALL allow the owner to remove images from their portfolio.

#### Scenario: Owner deletes an image
- **WHEN** the owner activates the delete control on an image and confirms
- **THEN** the system removes the image record, deletes the underlying storage object, and the image no longer appears in the dashboard or public renders

#### Scenario: Delete is confirmed before destruction
- **WHEN** the owner activates the delete control without confirming
- **THEN** the system shows a confirmation prompt and does not remove anything until the owner confirms

### Requirement: Publish state
The system SHALL allow the owner to toggle their portfolio between published and unpublished, and SHALL prevent public access while unpublished.

#### Scenario: Owner publishes the portfolio
- **WHEN** the owner toggles the publish control to "published"
- **THEN** the system marks the portfolio as published and the public URL `/u/:handle` becomes accessible to any visitor

#### Scenario: Owner unpublishes the portfolio
- **WHEN** the owner toggles the publish control to "unpublished"
- **THEN** the system marks the portfolio as unpublished and the public URL `/u/:handle` returns a not-found response to non-owner visitors

### Requirement: Owner-only mutations
The system SHALL ensure that only the owner of a portfolio can mutate its metadata, images, ordering, template selection, or publish state.

#### Scenario: Non-owner attempts mutation
- **WHEN** any authenticated user other than the owner attempts to mutate a portfolio
- **THEN** the system rejects the request with an authorization error and does not change any state
