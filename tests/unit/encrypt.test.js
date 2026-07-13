import assert from 'node:assert/strict';
import test from 'node:test';

import { encryptMessage } from '../../public/assets/js/crypto/encrypt.js';

test('rejects an empty message', async () => {
  await assert.rejects(
    encryptMessage({}, { message: '  ', publicKeys: [{}] }),
    /Enter a message to encrypt/,
  );
});

test('rejects an empty recipient list', async () => {
  await assert.rejects(
    encryptMessage({}, { message: 'hello', publicKeys: [] }),
    /Add at least one recipient public key/,
  );
});

test('creates and encrypts an armoured message', async () => {
  const recipients = [{ id: 'recipient' }];
  const calls = {};
  const openpgp = {
    async createMessage(options) {
      calls.createMessage = options;
      return { literal: options.text };
    },
    async encrypt(options) {
      calls.encrypt = options;
      return '-----BEGIN PGP MESSAGE-----';
    },
  };

  const result = await encryptMessage(openpgp, {
    message: 'hello',
    publicKeys: recipients,
  });

  assert.equal(result, '-----BEGIN PGP MESSAGE-----');
  assert.deepEqual(calls.createMessage, { text: 'hello' });
  assert.deepEqual(calls.encrypt, {
    message: { literal: 'hello' },
    encryptionKeys: recipients,
    format: 'armored',
  });
});

test('passes an optional signing key to OpenPGP.js', async () => {
  const signingKey = { id: 'signer' };
  let encryptionOptions;
  const openpgp = {
    async createMessage({ text }) {
      return text;
    },
    async encrypt(options) {
      encryptionOptions = options;
      return 'ciphertext';
    },
  };

  await encryptMessage(openpgp, {
    message: 'signed message',
    publicKeys: [{}],
    privateKey: signingKey,
  });

  assert.equal(encryptionOptions.signingKeys, signingKey);
});
