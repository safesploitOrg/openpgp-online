const publicKeySelector = '[data-public-key]';

export function createFormController(document) {
  const container = document.querySelector('#public-keys');
  const template = document.querySelector('#recipient-template');
  const signingFields = document.querySelector('#signing-fields');
  const signingToggle = document.querySelector('#toggle-signing');

  function renumberRecipients() {
    const recipients = [...container.querySelectorAll('.recipient')];

    recipients.forEach((recipient, index) => {
      const number = index + 1;
      recipient.querySelector('[data-recipient-number]').textContent = number;
      const textarea = recipient.querySelector(publicKeySelector);
      textarea.id = `public-key-${number}`;
      textarea.name = `public-key-${number}`;
      recipient.querySelector('[data-remove-recipient]').hidden = recipients.length === 1;
    });
  }

  function addRecipient() {
    const recipient = template.content.firstElementChild.cloneNode(true);
    recipient.querySelector('[data-remove-recipient]').addEventListener('click', () => {
      recipient.remove();
      renumberRecipients();
    });
    container.appendChild(recipient);
    renumberRecipients();
    return recipient.querySelector(publicKeySelector);
  }

  function toggleSigning() {
    const enabled = signingFields.hidden;
    signingFields.hidden = !enabled;
    signingToggle.setAttribute('aria-expanded', String(enabled));
    signingToggle.textContent = enabled ? 'Disable signing' : 'Enable signing';

    if (enabled) {
      document.querySelector('#private-key').focus();
    }
  }

  function getValues() {
    return {
      message: document.querySelector('#message').value,
      publicKeys: [...container.querySelectorAll(publicKeySelector)].map(({ value }) => value),
      signing: signingFields.hidden ? null : {
        privateKey: document.querySelector('#private-key').value,
        passphrase: document.querySelector('#passphrase').value,
      },
    };
  }

  function setBusy(busy) {
    const submit = document.querySelector('#encrypt-button');
    submit.disabled = busy;
    submit.textContent = busy ? 'Encrypting…' : 'Encrypt message';
  }

  document.querySelector('#add-public-key').addEventListener('click', () => addRecipient().focus());
  signingToggle.addEventListener('click', toggleSigning);
  addRecipient();

  return { getValues, setBusy };
}
