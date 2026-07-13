export async function encryptMessage(openpgp, { message, publicKeys, privateKey }) {
  if (!message.trim()) {
    throw new Error('Enter a message to encrypt.');
  }

  if (!publicKeys.length) {
    throw new Error('Add at least one recipient public key.');
  }

  const options = {
    message: await openpgp.createMessage({ text: message }),
    encryptionKeys: publicKeys,
    format: 'armored',
  };

  if (privateKey) {
    options.signingKeys = privateKey;
  }

  return openpgp.encrypt(options);
}
