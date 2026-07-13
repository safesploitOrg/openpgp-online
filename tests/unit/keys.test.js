import assert from 'node:assert/strict';
import test from 'node:test';

import {
  readPrivateKey,
  readPublicKey,
  readUniquePublicKeys,
} from '../../public/assets/js/crypto/keys.js';

function publicKey(fingerprint = 'abc123') {
  return {
    getFingerprint: () => fingerprint,
    isPrivate: () => false,
  };
}

test('reads and trims an armoured public key', async () => {
  let received;
  const key = publicKey();
  const openpgp = {
    async readKey(options) {
      received = options;
      return key;
    },
  };

  assert.equal(await readPublicKey(openpgp, '  PUBLIC KEY  '), key);
  assert.deepEqual(received, { armoredKey: 'PUBLIC KEY' });
});

test('rejects an empty public key', async () => {
  await assert.rejects(readPublicKey({}, '  '), /Public key is required/);
});

test('rejects private material in a public-key field', async () => {
  const openpgp = {
    async readKey() {
      return { isPrivate: () => true };
    },
  };

  await assert.rejects(
    readPublicKey(openpgp, 'PRIVATE KEY'),
    /private key was entered in a public-key field/,
  );
});

test('returns a clear public-key parsing error', async () => {
  const openpgp = {
    async readKey() {
      throw new Error('Invalid armor');
    },
  };

  await assert.rejects(
    readPublicKey(openpgp, 'BROKEN'),
    /public key could not be read: Invalid armor/,
  );
});

test('reads and unlocks a private key', async () => {
  const parsed = { encrypted: true };
  const unlocked = { encrypted: false };
  let decryptOptions;
  const openpgp = {
    async readPrivateKey() {
      return parsed;
    },
    async decryptKey(options) {
      decryptOptions = options;
      return unlocked;
    },
  };

  assert.equal(await readPrivateKey(openpgp, ' PRIVATE ', 'secret'), unlocked);
  assert.deepEqual(decryptOptions, { privateKey: parsed, passphrase: 'secret' });
});

test('does not expose the passphrase when private-key unlocking fails', async () => {
  const passphrase = 'highly-sensitive-passphrase';
  const openpgp = {
    async readPrivateKey() {
      return {};
    },
    async decryptKey() {
      throw new Error(`Bad passphrase: ${passphrase}`);
    },
  };

  await assert.rejects(readPrivateKey(openpgp, 'PRIVATE', passphrase), (error) => {
    assert.match(error.message, /could not be unlocked/);
    assert.doesNotMatch(error.message, new RegExp(passphrase));
    return true;
  });
});

test('rejects duplicate recipient fingerprints', async () => {
  const openpgp = {
    async readKey() {
      return publicKey('deadbeef');
    },
  };

  await assert.rejects(
    readUniquePublicKeys(openpgp, ['KEY ONE', 'KEY TWO']),
    /DEADBEEF was added more than once/,
  );
});

test('returns unique recipient keys in input order', async () => {
  const keys = [publicKey('one'), publicKey('two')];
  let index = 0;
  const openpgp = {
    async readKey() {
      return keys[index++];
    },
  };

  assert.deepEqual(await readUniquePublicKeys(openpgp, ['ONE', 'TWO']), keys);
});
