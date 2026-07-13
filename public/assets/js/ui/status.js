export function createStatusController(document) {
  const element = document.querySelector('#status');

  function show(message, type = 'info', focus = false) {
    element.textContent = message;
    element.className = `status status-${type}`;
    element.hidden = false;

    if (focus) {
      element.focus();
    }
  }

  function clear() {
    element.textContent = '';
    element.hidden = true;
  }

  return { clear, show };
}

