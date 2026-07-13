export async function copyText(text, clipboard = navigator.clipboard) {
  if (!text) {
    return { ok: false, message: 'There is no ciphertext to copy.' };
  }

  if (!clipboard?.writeText) {
    return { ok: false, message: 'Automatic copying is unavailable. Select and copy the ciphertext manually.' };
  }

  try {
    await clipboard.writeText(text);
    return { ok: true, message: 'Ciphertext copied to the clipboard.' };
  } catch {
    return { ok: false, message: 'Clipboard access was denied. Select and copy the ciphertext manually.' };
  }
}

