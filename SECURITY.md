# Security policy

## Client-side trust model

OpenPGP Online is a static application. Message encryption happens in the
browser, and the application has no backend to receive plaintext, keys, or
passphrases. This does not remove the need to trust the files delivered by the
hosting service. A compromised repository, deployment, domain, browser, or
extension could inspect sensitive values before they are encrypted.

The repository currently vendors the official OpenPGP.js 6.3.1 browser
distribution under `public/assets/js/openpgp_6.3.1/`. Do not modify its minified
bundle or source map directly. Future upgrades must use an official release,
retain its licence, update the versioned path, and rerun compatibility tests.

## Private keys

Public-key encryption does not require the sender's private key. Optional
private-key signing is an advanced feature and should only be used after the
application files and delivery path have been independently verified. Do not
enter high-value, long-term, or production private keys into an unverified web
application.

The application does not intentionally persist form values. JavaScript cannot
guarantee immediate erasure from browser memory, browser history, extensions,
the clipboard, or operating-system memory.

## Reporting a vulnerability

Please do not disclose a suspected vulnerability in a public issue. Use the
repository owner's private security-reporting channel when available. Include
the affected version, reproduction steps, impact, and any suggested mitigation.
Do not include real private keys, passphrases, or plaintext belonging to others.
