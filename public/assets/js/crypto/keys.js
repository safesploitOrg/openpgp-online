function requireArmour(armouredKey, type) {
  const value = armouredKey.trim();

  if (!value) {
    throw new Error(`${type} key is required.`);
  }

  return value;
}

export async function readPublicKey(openpgp, armouredKey) {
  const armoredKey = requireArmour(armouredKey, 'Public');

  try {
    const key = await openpgp.readKey({ armoredKey });

    if (key.isPrivate()) {
      throw new Error('A private key was entered in a public-key field.');
    }

    return key;
  } catch (error) {
    if (error.message === 'A private key was entered in a public-key field.') {
      throw error;
    }

    throw new Error(`The public key could not be read: ${error.message}`);
  }
}

export async function readPrivateKey(openpgp, armouredKey, passphrase) {
  const armoredKey = requireArmour(armouredKey, 'Private');

  try {
    const key = await openpgp.readPrivateKey({ armoredKey });
    return await openpgp.decryptKey({ privateKey: key, passphrase });
  } catch {
    throw new Error('The private key could not be unlocked. Check the key and passphrase.');
  }
}

export async function readUniquePublicKeys(openpgp, armouredKeys) {
  const fingerprints = new Set();
  const keys = [];

  for (const armouredKey of armouredKeys) {
    const key = await readPublicKey(openpgp, armouredKey);
    const fingerprint = key.getFingerprint();

    if (fingerprints.has(fingerprint)) {
      throw new Error(`Recipient key ${fingerprint.toUpperCase()} was added more than once.`);
    }

    fingerprints.add(fingerprint);
    keys.push(key);
  }

  return keys;
}
