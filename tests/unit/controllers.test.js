import assert from 'node:assert/strict';
import test from 'node:test';

import { clearSensitiveData } from '../../public/assets/js/security/sensitive-data.js';
import { createOutputController } from '../../public/assets/js/ui/output.js';
import { createStatusController } from '../../public/assets/js/ui/status.js';

test('status controller renders, focuses, and clears messages', () => {
  const element = {
    className: '',
    focusCalls: 0,
    hidden: true,
    textContent: '',
    focus() {
      this.focusCalls += 1;
    },
  };
  const controller = createStatusController({ querySelector: () => element });

  controller.show('Invalid key', 'error', true);
  assert.equal(element.textContent, 'Invalid key');
  assert.equal(element.className, 'status status-error');
  assert.equal(element.hidden, false);
  assert.equal(element.focusCalls, 1);

  controller.clear();
  assert.equal(element.textContent, '');
  assert.equal(element.hidden, true);
});

test('output controller renders, selects, and clears ciphertext', () => {
  const result = {
    hidden: true,
    scrollOptions: null,
    scrollIntoView(options) {
      this.scrollOptions = options;
    },
  };
  const output = {
    selectCalls: 0,
    value: '',
    select() {
      this.selectCalls += 1;
    },
  };
  const document = {
    querySelector(selector) {
      return selector === '#result' ? result : output;
    },
  };
  const controller = createOutputController(document);

  controller.render('ciphertext');
  assert.equal(controller.getValue(), 'ciphertext');
  assert.equal(result.hidden, false);
  assert.deepEqual(result.scrollOptions, { behavior: 'smooth', block: 'start' });

  controller.select();
  assert.equal(output.selectCalls, 1);

  controller.clear();
  assert.equal(output.value, '');
  assert.equal(result.hidden, true);
});

test('clear-sensitive-data empties every sensitive field and focuses the message', () => {
  const message = { value: 'plaintext', focusCalls: 0, focus() { this.focusCalls += 1; } };
  const privateKey = { value: 'private' };
  const passphrase = { value: 'secret' };
  const publicKeys = [{ value: 'public one' }, { value: 'public two' }];
  const fields = new Map([
    ['#message', [message]],
    ['#private-key', [privateKey]],
    ['#passphrase', [passphrase]],
    ['[data-public-key]', publicKeys],
  ]);
  const document = {
    querySelector: () => message,
    querySelectorAll: (selector) => fields.get(selector),
  };

  clearSensitiveData(document);

  assert.equal(message.value, '');
  assert.equal(privateKey.value, '');
  assert.equal(passphrase.value, '');
  assert.deepEqual(publicKeys.map(({ value }) => value), ['', '']);
  assert.equal(message.focusCalls, 1);
});
