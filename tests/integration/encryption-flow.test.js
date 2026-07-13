import assert from 'node:assert/strict';
import test from 'node:test';

import { decryptMessage } from '../../public/assets/js/crypto/decrypt.js';
import { encryptMessage } from '../../public/assets/js/crypto/encrypt.js';
import {
  readPrivateKey,
  readUniquePublicKeys,
} from '../../public/assets/js/crypto/keys.js';
import { loadOpenPgp } from '../helpers/load-openpgp.js';

test('encrypts, signs, decrypts, and verifies with the vendored browser bundle', async () => {
  const openpgp = loadOpenPgp();
  const passphrase = 'integration-test-passphrase';
  const plaintext = 'OpenPGP Online integration test';
  const generated = await openpgp.generateKey({
    userIDs: [{ name: 'OpenPGP Online test-only key' }],
    passphrase,
  });
  const publicKeys = await readUniquePublicKeys(openpgp, [generated.publicKey]);
  const privateKey = await readPrivateKey(openpgp, generated.privateKey, passphrase);

  const ciphertext = await encryptMessage(openpgp, {
    message: plaintext,
    publicKeys,
    privateKey,
  });

  assert.match(ciphertext, /^-----BEGIN PGP MESSAGE-----/);

  const decrypted = await decryptMessage(openpgp, {
    armoredMessage: ciphertext,
    privateKey,
    verificationKeys: publicKeys,
    expectSigned: true,
  });

  assert.equal(decrypted.data, plaintext);
  assert.equal(decrypted.signatures.length, 1);
  await assert.doesNotReject(decrypted.signatures[0].verified);
});
