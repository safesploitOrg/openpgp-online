export async function decryptMessage(
  openpgp,
  {
    armoredMessage,
    privateKey,
    verificationKeys = [],
    expectSigned = false,
  },
) {
  const ciphertext = typeof armoredMessage === 'string' ? armoredMessage.trim() : '';

  if (!ciphertext) {
    throw new Error('Enter an encrypted OpenPGP message.');
  }

  if (!privateKey) {
    throw new Error('A private key is required to decrypt the message.');
  }

  const options = {
    message: await openpgp.readMessage({ armoredMessage: ciphertext }),
    decryptionKeys: privateKey,
    format: 'utf8',
  };

  if (verificationKeys.length) {
    options.verificationKeys = verificationKeys;
  }

  if (expectSigned) {
    options.expectSigned = true;
  }

  return openpgp.decrypt(options);
}
