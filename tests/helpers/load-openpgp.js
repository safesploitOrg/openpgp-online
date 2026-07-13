import fs from 'node:fs';
import vm from 'node:vm';

const bundleUrl = new URL(
  '../../public/assets/js/openpgp_6.3.1/openpgp.min.js',
  import.meta.url,
);

export function loadOpenPgp() {
  if (!globalThis.__openpgpTestInstance) {
    const source = fs.readFileSync(bundleUrl, 'utf8');
    vm.runInThisContext(`${source}\n;globalThis.__openpgpTestInstance = openpgp;`);
  }

  return globalThis.__openpgpTestInstance;
}
