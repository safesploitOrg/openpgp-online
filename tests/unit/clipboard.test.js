import assert from 'node:assert/strict';
import test from 'node:test';

import { copyText } from '../../public/assets/js/ui/clipboard.js';

test('copies ciphertext through the Clipboard API', async () => {
  let copied;
  const clipboard = {
    async writeText(text) {
      copied = text;
    },
  };

  const result = await copyText('ciphertext', clipboard);

  assert.equal(copied, 'ciphertext');
  assert.deepEqual(result, {
    ok: true,
    message: 'Ciphertext copied to the clipboard.',
  });
});

test('does not invoke the clipboard for empty output', async () => {
  let called = false;
  const result = await copyText('', {
    async writeText() {
      called = true;
    },
  });

  assert.equal(called, false);
  assert.equal(result.ok, false);
});

test('returns a manual-copy fallback when the API is unavailable', async () => {
  const result = await copyText('ciphertext', null);

  assert.equal(result.ok, false);
  assert.match(result.message, /copy the ciphertext manually/);
});

test('returns a manual-copy fallback when permission is denied', async () => {
  const result = await copyText('ciphertext', {
    async writeText() {
      throw new Error('NotAllowedError');
    },
  });

  assert.equal(result.ok, false);
  assert.match(result.message, /Clipboard access was denied/);
});
