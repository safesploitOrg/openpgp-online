import assert from 'node:assert/strict';
import test from 'node:test';

import { decryptMessage } from '../../public/assets/js/crypto/decrypt.js';

test('rejects an empty encrypted message', async () => {
  await assert.rejects(
    decryptMessage({}, { armoredMessage: '  ', privateKey: {} }),
    /Enter an encrypted OpenPGP message/,
  );
});

test('rejects a missing encrypted message', async () => {
  await assert.rejects(
    decryptMessage({}, { privateKey: {} }),
    /Enter an encrypted OpenPGP message/,
  );
});

test('requires a private decryption key', async () => {
  await assert.rejects(
    decryptMessage({}, { armoredMessage: 'PGP MESSAGE' }),
    /private key is required to decrypt/,
  );
});

test('parses and decrypts an armoured message', async () => {
  const parsedMessage = { packets: [] };
  const privateKey = { id: 'private-key' };
  const calls = {};
  const openpgp = {
    async readMessage(options) {
      calls.readMessage = options;
      return parsedMessage;
    },
    async decrypt(options) {
      calls.decrypt = options;
      return { data: 'plaintext', signatures: [] };
    },
  };

  const result = await decryptMessage(openpgp, {
    armoredMessage: '  ARMOURED MESSAGE  ',
    privateKey,
  });

  assert.deepEqual(result, { data: 'plaintext', signatures: [] });
  assert.deepEqual(calls.readMessage, { armoredMessage: 'ARMOURED MESSAGE' });
  assert.deepEqual(calls.decrypt, {
    message: parsedMessage,
    decryptionKeys: privateKey,
    format: 'utf8',
  });
});

test('passes optional verification keys to OpenPGP.js', async () => {
  const verificationKeys = [{ id: 'signer-one' }, { id: 'signer-two' }];
  let decryptOptions;
  const openpgp = {
    async readMessage() {
      return {};
    },
    async decrypt(options) {
      decryptOptions = options;
      return { data: 'verified plaintext', signatures: [] };
    },
  };

  await decryptMessage(openpgp, {
    armoredMessage: 'MESSAGE',
    privateKey: {},
    verificationKeys,
  });

  assert.equal(decryptOptions.verificationKeys, verificationKeys);
  assert.equal('expectSigned' in decryptOptions, false);
});

test('can require a valid signature', async () => {
  let decryptOptions;
  const openpgp = {
    async readMessage() {
      return {};
    },
    async decrypt(options) {
      decryptOptions = options;
      return { data: 'verified plaintext', signatures: [{}] };
    },
  };

  await decryptMessage(openpgp, {
    armoredMessage: 'SIGNED MESSAGE',
    privateKey: {},
    verificationKeys: [{}],
    expectSigned: true,
  });

  assert.equal(decryptOptions.expectSigned, true);
});
