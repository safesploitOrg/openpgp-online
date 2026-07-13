import { encryptMessage } from './crypto/encrypt.js';
import { readPrivateKey, readUniquePublicKeys } from './crypto/keys.js';
import { clearSensitiveData } from './security/sensitive-data.js';
import { copyText } from './ui/clipboard.js';
import { createFormController } from './ui/form.js';
import { createOutputController } from './ui/output.js';
import { createStatusController } from './ui/status.js';

const formElement = document.querySelector('#encryption-form');
const form = createFormController(document);
const output = createOutputController(document);
const status = createStatusController(document);

function getOpenPgp() {
  if (!globalThis.openpgp) {
    throw new Error('The local OpenPGP library failed to load. Refresh the page and try again.');
  }

  return globalThis.openpgp;
}

formElement.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.clear();
  form.setBusy(true);

  try {
    const openpgp = getOpenPgp();
    const values = form.getValues();
    const publicKeys = await readUniquePublicKeys(openpgp, values.publicKeys);
    const privateKey = values.signing
      ? await readPrivateKey(openpgp, values.signing.privateKey, values.signing.passphrase)
      : undefined;
    const ciphertext = await encryptMessage(openpgp, {
      message: values.message,
      publicKeys,
      privateKey,
    });

    output.render(ciphertext);
    status.show('Encryption complete. The ciphertext is ready to copy.', 'success');

    if (values.signing) {
      document.querySelector('#private-key').value = '';
      document.querySelector('#passphrase').value = '';
    }
  } catch (error) {
    status.show(error.message || 'Encryption failed.', 'error', true);
  } finally {
    form.setBusy(false);
  }
});

document.querySelector('#copy').addEventListener('click', async () => {
  const result = await copyText(output.getValue());
  status.show(result.message, result.ok ? 'success' : 'error', !result.ok);

  if (!result.ok) {
    output.select();
  }
});

document.querySelector('#clear').addEventListener('click', () => {
  clearSensitiveData(document);
  output.clear();
  status.show('Message, keys, passphrase, and ciphertext cleared.', 'success');
});
