# OpenPGP Online

A static browser application for encrypting text to one or more OpenPGP public
keys. Encryption is performed locally; there is no application server, account,
or server-side key store.

## Current implementation

- Encrypts to one or more ASCII-armoured public keys.
- Optionally signs with an explicitly enabled private key.
- Copies ciphertext through the Clipboard API with a manual-copy fallback.
- Does not intentionally use browser persistence or make runtime network calls.
- Uses the locally hosted OpenPGP.js 6.3.1 browser distribution.

A DOM-independent decryption module is available for testing and future UI
work, but decryption is not yet exposed on the webpage. A future tabbed interface
will use `#encrypt` as its default tab and `#decrypt` as a separate decryption
tab.

The deployable website is entirely contained in `public/`. Serve that directory
as the web root during local development or deployment. For example:

```sh
python3 -m http.server 8000 --directory public
```

Then visit `http://localhost:8000`. ES modules do not work reliably when the
page is opened directly from a `file:` URL.

Application JavaScript lives in `public/assets/js/`, with focused subdirectories
for cryptography, UI behaviour, and sensitive-data handling. Everything outside
`public/` is repository documentation or development configuration and does not
need to be published.

## Tests

Node.js 22 or later is required. The test suite has no third-party runtime or
test-runner dependencies.

```sh
npm ci
npm test
```

Run only one test layer with `npm run test:unit` or
`npm run test:integration`. The integration test exercises the vendored browser
bundle through key generation, signing, encryption, decryption, and signature
verification using the same encryption and decryption modules as the site.

## Deployment

The `static.yml` GitHub Actions workflow runs the complete test suite and then
publishes only `public/` to GitHub Pages on pushes to `main` or manual dispatch.

## Security

Read [SECURITY.md](SECURITY.md) before using private-key signing. Browser-side
cryptography still requires trust in the delivered JavaScript, hosting path,
device, and browser environment.

The planned module, dependency, testing, and deployment architecture is
documented in [ARCHITECTURE.md](ARCHITECTURE.md).

## Attribution

This project is based on
[GPG-online by Alex Gorbatchev](http://alexgorbatchev.github.io/gpg-online/)
and uses [OpenPGP.js](https://github.com/openpgpjs/openpgpjs).
