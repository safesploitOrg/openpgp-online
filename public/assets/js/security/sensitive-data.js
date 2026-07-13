export function clearSensitiveData(document) {
  const selectors = ['#message', '#private-key', '#passphrase', '[data-public-key]'];

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((field) => {
      field.value = '';
    });
  });

  document.querySelector('#message').focus();
}

