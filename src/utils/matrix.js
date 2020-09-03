import Olm from 'olm';

exports.loadOlm = () => {
  /* Load Olm. We try the WebAssembly version first, and then the legacy,
   * asm.js version if that fails. For this reason we need to wait for this
   * to finish before continuing to load the rest of the app. In future
   * we could somehow pass a promise down to react-sdk and have it wait on
   * that so olm can be loading in parallel with the rest of the app.
   *
   * We also need to tell the Olm js to look for its wasm file at the same
   * level as index.html. It really should be in the same place as the js,
   * ie. in the bundle directory, to avoid caching issues, but as far as I
   * can tell this is completely impossible with webpack.
   */
  Olm.init({
    locateFile: () => 'olm.wasm',
  }).then(() => {
    // console.log('Using WebAssembly Olm');
  }).catch(() => {
    // console.log('Failed to load Olm: trying legacy version');
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'olm_legacy.js';
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    }).then(() =>
    // Init window.Olm, ie. the one just loaded by the script tag,
    // not 'Olm' which is still the failed wasm version.
      global.Olm.init(),
    ).then(() => {
      // console.log('Using legacy Olm');
    }).catch((e) => {
      // console.log('Both WebAssembly and asm.js Olm failed!', e);
    });
  });
};

exports.getMemberName = (member) => {
  const regExp = /^@([^:]+)/ig;
  const name = member.rawDisplayName || member.userId;
  const result = regExp.exec(name);
  if (result && result[1]) {
    return result[1];
  }
  return name;
};
