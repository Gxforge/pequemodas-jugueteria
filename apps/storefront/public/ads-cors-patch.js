/* global window */
// Compatibilidad con Cross-Origin-Resource-Policy del servidor central de anuncios.
// StudioLexair sirve ads.js y sus medios con CORP: same-origin + ACAO: *.
// Este shim, cargado antes de ads.js, activa el modo CORS en los elementos
// multimedia que apunten a ese host. No toca imágenes de Supabase ni de la tienda.
(function () {
  var ADS_HOST = 'studiolexair.ddns.net';

  function enableCors(element) {
    try {
      if (element && element.crossOrigin !== 'anonymous') {
        element.crossOrigin = 'anonymous';
      }
    } catch {
      // Nunca bloquear la tienda por un navegador que no permita la propiedad.
    }
  }

  function patchSrcSetter(prototype, property) {
    var descriptor = Object.getOwnPropertyDescriptor(prototype, property);
    if (!descriptor || !descriptor.set || !descriptor.configurable) return;
    Object.defineProperty(prototype, property, {
      configurable: true,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set: function (value) {
        if (String(value || '').indexOf(ADS_HOST) !== -1) enableCors(this);
        descriptor.set.call(this, value);
      }
    });
  }

  patchSrcSetter(window.HTMLImageElement.prototype, 'src');
  patchSrcSetter(window.HTMLMediaElement.prototype, 'src');
  patchSrcSetter(window.HTMLVideoElement.prototype, 'poster');
})();
