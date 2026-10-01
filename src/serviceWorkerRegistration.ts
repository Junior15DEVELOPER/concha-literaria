// Registro do Service Worker para suporte PWA na Concha Literária

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.info('[Concha Literária] Service Worker registrado com sucesso no escopo:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.info('[Concha Literária] Novo conteúdo disponível. Reinicie para atualizar.');
                } else {
                  console.info('[Concha Literária] Conteúdo cacheado para uso offline.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error('[Concha Literária] Erro ao registrar Service Worker:', error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
