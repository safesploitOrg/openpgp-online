export function createOutputController(document) {
  const result = document.querySelector('#result');
  const output = document.querySelector('#output');

  function render(ciphertext) {
    output.value = ciphertext;
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function clear() {
    output.value = '';
    result.hidden = true;
  }

  return { clear, getValue: () => output.value, render, select: () => output.select() };
}

