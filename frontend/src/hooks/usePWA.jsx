import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function usePWA() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const update = () => {
    updateServiceWorker(true);
  };

  return {
    offlineReady,
    needRefresh,
    close,
    update,
  };
}

export function PWABadge() {
  const { offlineReady, needRefresh, close, update } = usePWA();

  useEffect(() => {
    if (offlineReady) {
      console.log('[PWA] App ready to work offline');
    }
  }, [offlineReady]);

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 z-50 bg-gray-900 border border-cyan-500/50 rounded-lg shadow-2xl p-4 max-w-sm mx-auto lg:mx-0 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {offlineReady ? (
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-green-500 text-xl">✓</span>
            </div>
          ) : (
            <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
              <span className="text-cyan-500 text-xl">↻</span>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-white font-bold text-sm mb-1">
            {offlineReady ? 'App Ready!' : 'Update Available'}
          </h3>
          <p className="text-gray-400 text-xs mb-3">
            {offlineReady
              ? 'SecureTransac is ready to work offline'
              : 'A new version is available. Reload to update.'}
          </p>
          
          <div className="flex gap-2">
            {needRefresh && (
              <button
                onClick={update}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded transition-colors"
              >
                Update Now
              </button>
            )}
            <button
              onClick={close}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
