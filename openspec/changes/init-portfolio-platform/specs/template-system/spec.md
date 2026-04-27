## ADDED Requirements

### Requirement: Typed template contract
The system SHALL define a typed `Template` contract that any showcase template MUST implement.

#### Scenario: Template exposes required metadata and renderer
- **WHEN** a template module is registered
- **THEN** it exposes a typed object with `id` (kebab-case, unique), `name` (display name), `description`, `thumbnail` (URL or imported asset), a `defaultConfig` matching its declared `TemplateConfig` type, and a way to obtain a React component matching `React.FC<TemplateProps>` where `TemplateProps = { portfolio: Portfolio; images: PortfolioImage[]; config: TemplateConfig }`

#### Scenario: Template registration rejects duplicates
- **WHEN** two templates with the same `id` are registered
- **THEN** the system fails fast at registry initialization with an error identifying the duplicate id

### Requirement: Template registry
The system SHALL maintain a registry of available templates that the rest of the application reads from.

#### Scenario: Look up a registered template
- **WHEN** any consumer requests a template by id
- **THEN** the registry returns that template's metadata and a loader that resolves to its component

#### Scenario: List all registered templates
- **WHEN** any consumer requests the list of available templates
- **THEN** the registry returns every registered template's metadata in a stable order

#### Scenario: Look up an unknown id
- **WHEN** any consumer requests a template by an id that is not registered
- **THEN** the registry returns an explicit "not found" result that callers can handle (no exception)

### Requirement: Lazy-loaded templates
The system SHALL allow templates to be loaded lazily so that heavy dependencies are not in the main bundle.

#### Scenario: 3D template is not in the initial bundle
- **WHEN** the SPA's main bundle is built for production
- **THEN** the `three` and `@react-three/fiber` dependencies are absent from the entry chunk and load only when `gallery-3d` is rendered

#### Scenario: Loading state while fetching a lazy template
- **WHEN** a viewer requests a portfolio whose selected template loads lazily and the chunk has not yet been fetched
- **THEN** the system displays a loading placeholder until the chunk resolves, then renders the template

### Requirement: Initial templates
The system SHALL ship three initial templates: `simple-grid`, `side-titles`, and `gallery-3d`, each implementing the template contract.

#### Scenario: simple-grid renders all images in a responsive grid
- **WHEN** `simple-grid` renders a portfolio with images
- **THEN** images are arranged in a responsive grid that adapts column count to viewport width, preserves the portfolio's image order, and displays each image's alt text

#### Scenario: side-titles renders images full-bleed with captions in a side rail
- **WHEN** `side-titles` renders a portfolio with images
- **THEN** each image appears full-bleed with its title and description rendered in a side rail aligned to that image, and the rail collapses below the image on viewports narrower than 768px

#### Scenario: gallery-3d renders an interactive 3D carousel
- **WHEN** `gallery-3d` renders a portfolio with images on a device with `pointer: fine`
- **THEN** images are arranged in 3D space and the viewer can navigate forward and backward through them with mouse or keyboard input

#### Scenario: gallery-3d falls back on touch-only devices
- **WHEN** `gallery-3d` renders on a device matching `(pointer: coarse)`
- **THEN** the system renders a 2D swipeable carousel with the same image order as the 3D view

### Requirement: Per-portfolio template selection
The system SHALL let each portfolio specify which registered template renders it.

#### Scenario: Owner selects a template
- **WHEN** the owner picks a template from the dashboard's template list and confirms
- **THEN** the system persists the selection and the public render uses the selected template

#### Scenario: Default template at signup
- **WHEN** a portfolio is first provisioned
- **THEN** its template selection is `simple-grid`

#### Scenario: Live preview before saving
- **WHEN** the owner highlights a template in the dashboard's template picker
- **THEN** the system shows a preview of the owner's actual portfolio rendered through that template before the owner commits the choice

#### Scenario: Stored template id no longer registered
- **WHEN** a portfolio's stored template id is not present in the registry at render time
- **THEN** the system falls back to `simple-grid`, logs a warning, and renders the portfolio without failing
