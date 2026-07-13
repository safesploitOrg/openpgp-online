# Architecture

## 1. Overview

`openpgp-online` is a static, browser-based application for encrypting text with one or more OpenPGP public keys.

All cryptographic operations are performed within the user's browser. The application does not require an application server, database or server-side API.

The current implementation uses:

- HTML for the interface and application structure.
- CSS for presentation.
- JavaScript for DOM manipulation and encryption workflows.
- OpenPGP.js for OpenPGP key parsing and message encryption.
- GitHub Pages and a custom domain for static hosting.

The project is based on the original GPG-online client-side application and has been adapted and branded for SWS Solutions.

---

## 2. Architectural Principles

The application follows several important principles.

### Client-side cryptography

Plaintext messages, private keys and passphrases are intended to remain inside the browser.

The hosting platform delivers static application files but does not directly process cryptographic material.

### Minimal infrastructure

The application does not require:

- A backend service.
- A database.
- User accounts.
- Server-side key storage.
- Server-side session management.

### Portable static deployment

The application can be hosted from any platform capable of serving static files, including:

- GitHub Pages.
- Nginx.
- Apache HTTP Server.
- Object storage with static website hosting.
- A content delivery network.

### Explicit trust boundary

Although encryption occurs locally, users must still trust the JavaScript delivered by the hosting platform.

A compromised repository, deployment workflow, DNS record, hosting account or third-party dependency could alter the JavaScript and capture plaintext or private key material before encryption.

---

## 3. Current Architecture

> **Implementation status:** Phase 0's repository-local controls and Phase 1's
> application separation were started in July 2026. External repository controls
> still require configuration on the hosting platform. OpenPGP.js was upgraded
> to v6.3.1 in July 2026; package-based dependency management remains a future
> phase.

```text
┌───────────────────────────────────────────┐
│                End User                   │
│                                           │
│  Plaintext                                │
│  Public key(s)                            │
│  Optional private key and passphrase      │
└──────────────────────┬────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────┐
│              Web Browser                  │
│                                           │
│  public/index.html                        │
│  public/assets/css/style.css               │
│  public/assets/js/app.js and modules       │
│  public/assets/js/openpgp_6.3.1/           │
│                                           │
│  DOM event handlers                       │
│  Key parsing                              │
│  Message encryption                       │
│  Clipboard interaction                    │
└──────────────────────┬────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────┐
│          ASCII-armoured ciphertext        │
│                                           │
│  -----BEGIN PGP MESSAGE-----              │
│  ...                                      │
│  -----END PGP MESSAGE-----                │
└───────────────────────────────────────────┘
```

No plaintext or key material should be transmitted to an application backend because no backend exists.

---

## 4. Repository Structure

```text
openpgp-online/
├── .github/
│   └── workflows/
│       └── static.yml
├── public/
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       ├── app.js
│   │       ├── openpgp_6.3.1/
│   │       │   ├── LICENSE
│   │       │   ├── README.md
│   │       │   ├── openpgp.min.js
│   │       │   └── openpgp.min.js.map
│   │       ├── crypto/
│   │       │   ├── decrypt.js
│   │       │   ├── encrypt.js
│   │       │   └── keys.js
│   │       ├── security/
│   │       │   └── sensitive-data.js
│   │       └── ui/
│   │           ├── clipboard.js
│   │           ├── form.js
│   │           ├── output.js
│   │           └── status.js
│   ├── CNAME
│   └── index.html
├── tests/
│   ├── helpers/
│   │   └── load-openpgp.js
│   ├── integration/
│   │   └── encryption-flow.test.js
│   └── unit/
│       ├── clipboard.test.js
│       ├── controllers.test.js
│       ├── decrypt.test.js
│       ├── encrypt.test.js
│       └── keys.test.js
├── .gitignore
├── .nvmrc
├── ARCHITECTURE.md
├── package-lock.json
├── package.json
├── README.md
└── SECURITY.md
```

### `public/index.html`

The main application entry point.

It currently contains:

- The user interface.
- Message and key input fields.
- Controls for adding public and private keys.
- A template for dynamically added recipient fields.
- References to the local stylesheet, OpenPGP library and application module.

### `public/assets/css/style.css`

Provides application styling and presentation rules.

### `public/assets/js/`

Contains separated ES modules for application orchestration, key parsing,
encryption, form behaviour, output rendering, clipboard access, status messages
and sensitive-data clearing. Cryptographic modules do not manipulate the DOM.

### `public/assets/js/openpgp_6.3.1/`

A versioned copy of the official OpenPGP.js browser distribution.

The directory contains OpenPGP.js v6.3.1, its source map and its LGPL licence.
The versioned path makes the deployed cryptographic dependency explicit and
allows upgrades to be reviewed as discrete changes.

### `public/CNAME`

Configures the custom domain used by GitHub Pages.

### `tests/`

Contains zero-dependency Node unit tests and an integration test that exercises
the vendored OpenPGP.js browser bundle through a complete signed encryption and
decryption cycle.

### `.github/workflows/static.yml`

Runs the test suite and deploys only the `public/` site root to GitHub Pages on
pushes to `main` or manual dispatch.

### `README.md`

Provides a brief project description, feature summary and attribution to the original project.

---

## 5. Current Application Flow

### 5.1 Application loading

The browser retrieves the static site files:

```text
public/index.html
    ├── assets/css/style.css
    ├── assets/js/app.js
    └── assets/js/openpgp_6.3.1/openpgp.min.js
```

The OpenPGP library is loaded into the global browser scope as `openpgp`.

### 5.2 Message entry

The user enters plaintext into the message text area.

The message remains in the browser DOM until it is:

- Replaced by the user.
- Removed through navigation or refresh.
- Potentially retained by browser features such as form restoration.

### 5.3 Recipient key processing

The user supplies one or more ASCII-armoured OpenPGP public keys.

Additional recipient fields are created by cloning the existing public-key HTML template.

Each key is parsed by OpenPGP.js before encryption.

### 5.4 Optional signing key

The user can reveal an optional private-key section and provide:

- An ASCII-armoured private key.
- The corresponding passphrase.

The application attempts to decrypt the private key in memory and passes it into the encryption operation.

This enables encryption with an optional signing key, subject to the behaviour of the installed OpenPGP.js version.

### 5.5 Encryption

The application constructs an encryption request containing:

- The plaintext message.
- Parsed public recipient keys.
- An optional decrypted private key.
- ASCII armour output enabled.

OpenPGP.js performs the cryptographic operation and returns an ASCII-armoured message.

### 5.6 Output

The encrypted result is inserted into the page and can be copied to the clipboard.

The ciphertext is not automatically uploaded or stored by the application.

---

## 6. Trust Boundaries

```text
                 Untrusted or external
┌─────────────────────────────────────────────────────┐
│ User device                                        │
│ Browser extensions                                 │
│ Browser clipboard                                  │
│ DNS and network path                               │
│ GitHub account and repository                      │
│ GitHub Pages deployment                            │
│ Third-party JavaScript dependencies                │
└────────────────────────┬────────────────────────────┘
                         │
                  Trust boundary
                         │
┌────────────────────────▼────────────────────────────┐
│ Application execution context                      │
│                                                     │
│ Plaintext                                           │
│ Public keys                                         │
│ Private keys                                        │
│ Passphrases                                         │
│ Decrypted private-key objects                       │
│ Generated ciphertext                                │
└─────────────────────────────────────────────────────┘
```

The client-side model prevents a conventional application server from receiving plaintext. It does not eliminate the need to trust the delivered application code.

---

## 7. Security Considerations

### 7.1 Private-key handling

Entering a private key into a website carries a higher risk than encrypting with public keys alone.

Private keys and passphrases may be exposed through:

- Malicious or compromised JavaScript.
- Browser extensions.
- Clipboard managers.
- Browser developer tools.
- Memory inspection.
- DOM inspection.
- Compromised hosting or deployment accounts.
- Cross-site scripting vulnerabilities.

The application should warn users not to enter high-value, long-term or production private keys unless they have independently verified the application artefacts.

A safer default is to support encryption with public keys while treating private-key signing as an advanced, explicitly enabled feature.

### 7.2 Embedded public key

The previous HTML contained a pre-populated public key. It was removed during
the initial separation work so that encryption always requires an explicit
recipient choice.

Retaining or reintroducing an embedded key would create several concerns:

- Users may encrypt to the wrong recipient without noticing.
- Key expiry or revocation is not automatically detected externally.
- Replacing the key requires changing application source.
- The identity and fingerprint are not prominently verified.

The embedded key should either be removed or represented through a clearly labelled configuration file containing its expected fingerprint and purpose.

### 7.3 Cryptographic dependency

The application uses OpenPGP.js v6.3.1 from the project's official npm
distribution. The legacy v2.3.0 bundle and API have been removed.

The library should ultimately be installed through an explicit package
dependency and lockfile rather than updated manually.

Every upgrade must include compatibility and interoperability testing because
cryptographic defaults and supported key algorithms can change between releases.

### 7.4 Dynamic HTML generation

The previous implementation assembled output as an HTML string and assigned it
using `innerHTML`. The current output controller assigns ciphertext through a
textarea's `value` property and registers all handlers with `addEventListener`.

Security-sensitive application code should continue to use:

- `document.createElement`.
- `textContent`.
- Explicit DOM attributes.
- Registered event listeners rather than inline `onclick` handlers.

### 7.5 Clipboard access

Clipboard operations require a secure browser context and may fail due to browser permissions.

Clipboard functionality should:

- Use `navigator.clipboard.writeText()`.
- Handle permission failures.
- Provide a manual-copy fallback.
- Avoid replacing encrypted output with status text.
- Never automatically copy plaintext, keys or passphrases.

### 7.6 Content Security Policy

Application JavaScript has been moved into external modules, removing the need
for `unsafe-inline` script execution. A tested deployment policy is still to be
introduced in a later hardening phase, for example:

```text
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' data:;
connect-src 'none';
object-src 'none';
base-uri 'none';
form-action 'none';
frame-ancestors 'none';
```

The exact policy must be tested against the selected hosting platform.

### 7.7 Browser persistence

Sensitive form values should not be intentionally persisted.

Recommended controls include:

- Disabling autocomplete for private-key and passphrase inputs.
- Clearing private-key objects after operations where practical.
- Providing a prominent **Clear sensitive data** action.
- Clearing the private-key and passphrase fields after signing.
- Avoiding local storage, session storage and IndexedDB for cryptographic material.

JavaScript cannot guarantee immediate memory erasure because browser memory management and garbage collection are outside application control.

### 7.8 Supply-chain security

The application executes cryptographic code supplied through the repository.

Recommended controls include:

- Protected branches.
- Mandatory pull-request review.
- Signed commits or verified signatures.
- Dependabot.
- Dependency review.
- CodeQL scanning.
- Pinned GitHub Actions.
- Minimal workflow permissions.
- Reproducible builds.
- Published release checksums.
- A documented release process.

---

## 8. Current Architectural Limitations

| Area | Current state | Consequence |
|---|---|---|
| Dependency management | Minified library committed directly | Version provenance and updates are difficult to manage |
| OpenPGP library | OpenPGP.js v6.3.1 browser distribution | Current API is in use; dependency installation is not yet reproducible |
| Application structure | Logic extracted from `index.html` | Initial separation complete; build tooling remains absent |
| Module boundaries | Crypto, UI and security modules introduced | Validation and compatibility layers still need expansion |
| Testing | Node unit tests and a cryptographic integration test | Browser DOM and cross-browser coverage remain outstanding |
| Build system | Package metadata and lockfile, but no build configuration | The static site is deployable directly; dependency installation is not yet managed |
| CI | Pages workflow runs tests before deployment | Pull-request, lint, coverage and security workflows remain outstanding |
| Error handling | Accessible in-page status region | Errors are local-only and intentionally not remotely observed |
| Output rendering | Ciphertext assigned through textarea `value` | Text-safe rendering is in place |
| Key validation | Minimal parsing validation | Weak feedback for expired, revoked or unsuitable keys |
| Security headers | Hosting-dependent | Browser hardening may be incomplete |
| Accessibility | Basic form markup | Labels, focus handling and status messages need improvement |
| Observability | None by design | Failures are visible only to the local user |

---

## 9. Target Architecture

The target architecture retains local-only cryptography while introducing testable modules, dependency management and secure CI/CD.

```text
openpgp-online/
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── ci.yml
│       ├── codeql.yml
│       └── static.yml
├── public/
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       ├── app.js
│   │       ├── crypto/
│   │       │   ├── decrypt.js
│   │       │   ├── encrypt.js
│   │       │   ├── keys.js
│   │       │   └── validation.js
│   │       ├── ui/
│   │       │   ├── clipboard.js
│   │       │   ├── form.js
│   │       │   ├── output.js
│   │       │   └── status.js
│   │       └── security/
│   │           └── sensitive-data.js
│   ├── CNAME
│   ├── favicon.svg
│   └── index.html
├── tests/
│   ├── fixtures/
│   │   ├── public-key.asc
│   │   ├── private-key.asc
│   │   └── revoked-key.asc
│   ├── unit/
│   │   ├── clipboard.test.js
│   │   ├── controllers.test.js
│   │   ├── decrypt.test.js
│   │   ├── encrypt.test.js
│   │   ├── keys.test.js
│   │   └── validation.test.js
│   └── integration/
│       └── encryption-flow.test.js
├── package.json
├── package-lock.json
├── vite.config.js
├── vitest.config.js
├── eslint.config.js
├── ARCHITECTURE.md
├── SECURITY.md
└── README.md
```

### Target module responsibilities

#### `public/assets/js/crypto/keys.js`

Responsible for:

- Reading armoured public keys.
- Reading armoured private keys.
- Decrypting protected private keys.
- Extracting key IDs and fingerprints.
- Returning structured errors.

#### `public/assets/js/crypto/validation.js`

Responsible for:

- Rejecting empty key material.
- Detecting malformed keys.
- Checking key expiry.
- Identifying revoked keys where supported.
- Confirming that encryption-capable subkeys exist.
- Preventing duplicate recipient keys.

#### `public/assets/js/crypto/encrypt.js`

Responsible for:

- Creating OpenPGP message objects.
- Encrypting to one or more recipients.
- Optionally signing with a decrypted private key.
- Returning ASCII-armoured ciphertext.
- Remaining independent from the browser DOM.

#### `public/assets/js/crypto/decrypt.js`

Responsible for:

- Reading ASCII-armoured OpenPGP messages.
- Decrypting with an unlocked private key.
- Optionally verifying signatures against supplied public keys.
- Supporting a policy that requires signed messages.
- Returning plaintext and signature results without manipulating the DOM.

The module is implemented and tested but is not currently connected to the
webpage. A future decryption interface must use a separate `#decrypt` tab. The
future encryption tab will use `#encrypt` and remain the default. The existing
submit control uses `#encrypt-button`, leaving the tab identifier unambiguous.

#### `public/assets/js/ui/form.js`

Responsible for:

- Reading form values.
- Adding and removing recipient fields.
- Enabling advanced signing options.
- Resetting sensitive fields.
- Controlling focus and accessibility.

#### `public/assets/js/ui/output.js`

Responsible for:

- Rendering ciphertext through a text-safe form control value.
- Displaying non-sensitive status messages.
- Preserving output during clipboard operations.

#### `public/assets/js/ui/clipboard.js`

Responsible for:

- Copying ciphertext.
- Handling unsupported or denied clipboard access.
- Returning an explicit success or failure result.

#### `public/assets/js/security/sensitive-data.js`

Responsible for:

- Clearing private-key and passphrase fields.
- Avoiding accidental browser persistence.
- Centralising sensitive-data lifecycle controls.

---

## 10. Testing Strategy

The project should use multiple test layers.

### 10.1 Unit tests

Unit tests should cover pure application logic without requiring a complete browser.

Recommended cases include:

#### Public-key parsing

- Accept a valid ASCII-armoured public key.
- Reject an empty key.
- Reject malformed armour.
- Reject private-key material where a public key is required.
- Return the expected fingerprint.
- Detect duplicate fingerprints.

#### Private-key handling

- Accept a valid encrypted private key.
- Reject an incorrect passphrase.
- Reject malformed private-key material.
- Return a decrypted key object for a valid passphrase.
- Ensure passphrases are not included in error messages.

#### Encryption

- Encrypt a message for one recipient.
- Encrypt a message for multiple recipients.
- Produce ASCII-armoured output.
- Reject an empty message where required by policy.
- Reject an empty recipient list.
- Sign and encrypt using a test private key.
- Confirm that recipients can decrypt generated ciphertext.

#### Validation

- Identify an expired key.
- Identify a revoked key where supported.
- Reject a key without a usable encryption subkey.
- Normalise line endings in armoured key data.
- Prevent duplicate recipients.

#### Clipboard handling

- Copy ciphertext successfully.
- Handle clipboard permission denial.
- Handle an unavailable Clipboard API.
- Confirm that plaintext and private keys are never passed to the clipboard helper.

### 10.2 DOM tests

Run DOM-facing tests in a browser-like test environment such as `jsdom`.

Test cases should include:

- Adding a recipient field.
- Removing a recipient field.
- Revealing signing controls.
- Displaying validation errors.
- Preventing double submission.
- Rendering output using text-safe DOM operations.
- Clearing sensitive fields.
- Preserving encrypted output after copying.
- Moving focus to error summaries where appropriate.

### 10.3 Integration tests

Integration tests should exercise the complete local encryption workflow using dedicated test keys.

```text
Load test page
    ↓
Enter plaintext
    ↓
Insert test public key
    ↓
Select Encrypt
    ↓
Capture armoured ciphertext
    ↓
Decrypt using corresponding test private key
    ↓
Assert recovered plaintext matches input
```

Private keys committed for testing must be clearly marked as test-only and must never be reused outside automated tests.

### 10.4 End-to-end tests

A later phase may introduce Playwright tests against a production build.

Recommended browser coverage:

- Chromium.
- Firefox.
- WebKit.

End-to-end checks should verify:

- Page loading.
- Encryption.
- Multiple recipients.
- Clipboard behaviour.
- Mobile viewport behaviour.
- Keyboard navigation.
- Error handling.
- Deployment path correctness.

### 10.5 Security tests

Automated security validation should include:

- `npm audit`.
- Dependency review on pull requests.
- CodeQL for JavaScript and GitHub Actions.
- Secret scanning.
- Static analysis through ESLint.
- Content Security Policy checks.
- Verification that production bundles contain no source-map secrets.
- Verification that no network requests occur during encryption.

A test can instrument `fetch`, `XMLHttpRequest`, `WebSocket` and `sendBeacon` and fail if encryption triggers outbound communication.

### 10.6 Coverage targets

Initial targets should be achievable rather than ceremonial.

| Stage | Target |
|---|---:|
| Initial unit-test adoption | 60% line coverage |
| Crypto module stabilisation | 80% line coverage |
| Mature project | 85%+ branch coverage for crypto and validation modules |

Coverage should not replace meaningful test cases. Security-sensitive branches and failure paths are more important than achieving a repository-wide percentage.

---

## 11. Continuous Integration

Pull requests and changes to the default branch should run:

```text
Checkout
    ↓
Install pinned Node.js version
    ↓
npm ci
    ↓
Dependency audit
    ↓
Formatting check
    ↓
ESLint
    ↓
Unit tests
    ↓
Coverage
    ↓
Production build
    ↓
End-to-end smoke test
    ↓
Upload test and build artefacts
```

Recommended branch protection rules:

- Pull requests required.
- At least one approving review.
- Required CI status checks.
- Conversation resolution required.
- Direct pushes to `main` disabled.
- Force pushes disabled.
- Branch deletion disabled.

GitHub Actions workflows should use:

```yaml
permissions:
  contents: read
```

Additional permissions should only be granted to the specific deployment job that requires them.

Third-party actions should be pinned to immutable commit SHAs where practical.

---

## 12. Deployment Architecture

### Current deployment

```text
Git repository
      ↓
GitHub Pages
      ↓
Custom domain
      ↓
User browser
```

### Target deployment

```text
Pull request
    ↓
Lint, test and security validation
    ↓
Protected main branch
    ↓
Reproducible production build
    ↓
Immutable deployment artefact
    ↓
GitHub Pages environment
    ↓
Custom domain and HTTPS
```

The deployment should use `public/` as its site root and publish only that
directory, rather than exposing the complete development workspace. When a
build step is introduced, its immutable deployment artefact must preserve the
same public URL structure.

A deployment environment should be used to separate build validation from production publication.

---

## 13. Modernisation Roadmap

### Phase 0 — Establish a security baseline

**Priority: Critical**

- Document the current OpenPGP.js version.
- Add `SECURITY.md`.
- Add an explicit warning around private-key entry.
- Remove or clearly label the embedded default public key.
- Record the expected fingerprint for any retained default key.
- Enable branch protection.
- Enable Dependabot and repository security scanning.
- Verify HTTPS enforcement for the custom domain.
- Document the application's client-side trust model.

**Exit criteria**

- Current risks are documented.
- Repository changes require review.
- Users are warned about sensitive private-key handling.

### Phase 1 — Separate application logic

**Priority: High**

- Move inline JavaScript out of `index.html`.
- Introduce ES modules.
- Separate cryptographic logic from DOM logic.
- Replace global variables with module-scoped state.
- Replace promise chains with consistent `async`/`await`.
- Replace browser alerts with accessible status messages.
- Replace inline event handlers with `addEventListener`.
- Replace `innerHTML` output generation with safe DOM APIs.

**Exit criteria**

- `index.html` contains structure rather than business logic.
- Crypto functions can execute independently from the DOM.
- No encrypted result is rendered through HTML string concatenation.

### Phase 2 — Introduce dependency and build management

**Priority: High**

**Status:** In progress. Package metadata, a lockfile and a Node.js 22 pin are
present. Managed application dependencies, linting and production build tooling
remain outstanding.

- Add `package.json` and a lockfile.
- Add OpenPGP.js as a managed dependency.
- Introduce Vite or an equivalent minimal build tool.
- Add development and production build commands.
- Pin a supported Node.js release for development and CI.
- Add ESLint and formatting validation.
- Generate deterministic production artefacts.

Suggested scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Exit criteria**

- A clean checkout can be built using documented commands.
- Dependency versions are locked.
- The vendored `openpgp.min.js` file is no longer manually maintained.

### Phase 3 — Upgrade OpenPGP.js

**Priority: Critical**

**Status:** In progress. The browser bundle and application API were upgraded
from v2.3.0 to v6.3.1 in July 2026. Automated compatibility, GnuPG
interoperability and legacy-key coverage remain outstanding.

- Maintain compatibility tests around the existing behaviour.
- Keep OpenPGP.js on a maintained release.
- Do not reintroduce removed legacy APIs such as:
  - `openpgp.key.readArmored`.
  - Legacy `data`, `publicKeys` and `privateKey` encryption options.
- Adopt current message and key APIs.
- Validate interoperability with GnuPG.
- Test legacy public keys used by intended recipients.
- Review algorithm compatibility before enforcing stricter defaults.
- Document any unsupported legacy keys.

**Exit criteria**

- Encryption works with the maintained OpenPGP.js API.
- Test ciphertext can be decrypted by both OpenPGP.js and GnuPG.
- Unsupported algorithms and keys produce clear errors.

### Phase 4 — Introduce unit testing

**Priority: High**

**Status:** In progress. The initial zero-dependency `node:test` suite covers
crypto options, keys, clipboard behaviour, output/status controllers and
sensitive-data clearing. Full DOM tests and coverage reporting remain
outstanding; a browser-like test dependency can be introduced with those tests.

- Reassess whether Vitest adds value when browser-like DOM tests are introduced.
- Add a browser-like DOM test environment.
- Create dedicated test-only key fixtures.
- Test key parsing and validation.
- Test encryption for one and multiple recipients.
- Test optional signing.
- Test error paths.
- Test clipboard handling.
- Publish coverage reports in CI.

**Exit criteria**

- Crypto and key-validation modules have meaningful automated coverage.
- Every pull request runs the unit-test suite.
- A failed cryptographic regression blocks merging.

### Phase 5 — Add integration and browser testing

**Priority: Medium**

**Status:** In progress. A complete generated-key encryption, signing,
decryption and signature-verification integration test runs against the vendored
OpenPGP.js browser bundle. Browser automation remains outstanding.

- Add complete encryption/decryption integration tests.
- Add Playwright smoke tests.
- Test Chromium, Firefox and WebKit.
- Add accessibility checks.
- Test keyboard-only operation.
- Test mobile and narrow-screen layouts.
- Test production builds rather than development-only execution.

**Exit criteria**

- The main user workflow is validated in supported browsers.
- Deployment path and production bundle regressions are detected automatically.

### Phase 6 — Browser and application hardening

**Priority: High**

- Implement a strict Content Security Policy.
- Remove the need for `unsafe-inline`.
- Add security-related meta and HTTP headers where supported.
- Disable unnecessary network destinations through CSP.
- Add a clear-sensitive-data function.
- Disable autocomplete on sensitive fields.
- Add protection against repeated submissions.
- Avoid analytics or third-party scripts on the cryptographic page.
- Document limitations of JavaScript memory clearing.
- Verify that encryption generates no outbound network traffic.

**Exit criteria**

- The application runs under a restrictive CSP.
- No third-party runtime scripts are required.
- Automated tests confirm local-only encryption behaviour.

### Phase 7 — Improve usability and key assurance

**Priority: Medium**

- Display recipient fingerprints before encryption.
- Display key identities and expiry dates.
- Warn about expired, revoked or weak keys.
- Detect duplicate recipient keys.
- Allow recipient fields to be removed.
- Add drag-and-drop or file-based public-key import.
- Add visible encryption progress and completion status.
- Add a single action to clear all sensitive material.
- Improve accessible labels, focus order and live regions.
- Explain the difference between encryption and signing.

**Exit criteria**

- Users can verify which keys will receive the message.
- Invalid or unsuitable keys are rejected before encryption.
- Sensitive values can be cleared through one visible control.

### Phase 8 — Release assurance

**Priority: Medium**

- Introduce semantic versioning.
- Generate release notes.
- Publish checksums for production artefacts.
- Consider signing releases.
- Add a software bill of materials.
- Add dependency licence reporting.
- Document the build and release procedure.
- Consider reproducible build verification.
- Maintain a supported-browser matrix.

**Exit criteria**

- Every production deployment maps to a reviewed release.
- Users can verify the integrity and provenance of published artefacts.

---

## 14. Recommended Delivery Order

```text
Security warning and repository protection
                    ↓
Extract inline JavaScript
                    ↓
Create crypto and UI modules
                    ↓
Upgrade OpenPGP.js runtime and API
                    ↓
Add package management and build tooling
                    ↓
Add behavioural and interoperability tests
                    ↓
Expand unit and integration coverage
                    ↓
Introduce strict CSP and browser hardening
                    ↓
Add end-to-end testing and release assurance
```

Tests should be introduced before the OpenPGP.js migration is completed. This provides a behavioural safety net for the API upgrade.

---

## 15. Architectural Decisions

### ADR-001: Retain a client-only architecture

**Decision:** Cryptographic operations will remain inside the browser.

**Rationale:**

- Avoids transmitting plaintext to an application backend.
- Retains static hosting.
- Minimises infrastructure and attack surface.
- Supports offline use after application resources have loaded.

**Trade-off:** Users must trust the JavaScript and hosting supply chain.

### ADR-002: Do not persist sensitive material

**Decision:** Plaintext, private keys and passphrases will not be stored in browser persistence mechanisms.

**Rationale:**

- Reduces residual exposure.
- Avoids accidental retention on shared devices.
- Keeps the application stateless.

### ADR-003: Use managed dependencies

**Decision:** OpenPGP.js will be installed through the JavaScript package ecosystem and locked to an explicit version.

**Rationale:**

- Improves provenance.
- Enables automated dependency scanning.
- Makes upgrades reproducible.
- Avoids manually maintaining a minified vendor file.

### ADR-004: Separate cryptography from presentation

**Decision:** Cryptographic functions will not directly manipulate the DOM.

**Rationale:**

- Enables unit testing.
- Reduces coupling.
- Makes security review easier.
- Allows the interface to change without modifying encryption logic.

### ADR-005: Treat private-key support as an advanced feature

**Decision:** Public-key encryption remains the primary workflow, while private-key signing requires explicit user action and additional warning.

**Rationale:**

- Private keys represent substantially more sensitive material.
- Encryption does not require the sender's private key.
- Users may incorrectly assume that all client-side websites are inherently safe.

---

## 16. Non-goals

The modernisation roadmap does not currently require:

- A user-account system.
- Server-side key storage.
- A public-key directory.
- Automatic key-server lookup.
- Cloud storage of messages.
- Server-side decryption.
- Message delivery.
- Email integration.
- Recovery of lost private keys or passphrases.

Any future feature requiring network transmission of keys or message content must receive a separate threat model and architectural review.

---

## 17. References

- [OpenPGP.js](https://openpgpjs.org/)
- [OpenPGP.js documentation](https://docs.openpgpjs.org/)
- [OpenPGP.js repository](https://github.com/openpgpjs/openpgpjs)
- [RFC 9580 — OpenPGP](https://www.rfc-editor.org/rfc/rfc9580)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [GitHub CodeQL documentation](https://docs.github.com/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql)
- [GitHub dependency review](https://docs.github.com/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review)
