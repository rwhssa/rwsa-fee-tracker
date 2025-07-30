// Service Worker 幫助工具
// 用於處理開發環境中的快取問題和 Service Worker 更新

export const isDevelopment = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0')
  );
};

export const clearAllCaches = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        console.log(`[SW Helper] Clearing cache: ${cacheName}`);
        return caches.delete(cacheName);
      })
    );
    console.log('[SW Helper] All caches cleared');
  } catch (error) {
    console.error('[SW Helper] Failed to clear caches:', error);
  }
};

export const unregisterAllServiceWorkers = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(registration => {
        console.log('[SW Helper] Unregistering service worker');
        return registration.unregister();
      })
    );
    console.log('[SW Helper] All service workers unregistered');
  } catch (error) {
    console.error('[SW Helper] Failed to unregister service workers:', error);
  }
};

export const forceRefreshApp = (): void => {
  if (typeof window !== 'undefined') {
    // Clear browser cache and reload
    window.location.reload();
  }
};

export const setupDevModeCleanup = (): void => {
  if (!isDevelopment()) {
    return;
  }

  console.log('[SW Helper] Development mode detected, setting up cache cleanup');

  // Clear everything on page load in development
  window.addEventListener('load', async () => {
    await clearAllCaches();
    await unregisterAllServiceWorkers();
  });

  // Add keyboard shortcut for manual cache clear (Ctrl/Cmd + Shift + R)
  window.addEventListener('keydown', async (event) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
      event.preventDefault();
      console.log('[SW Helper] Manual cache clear triggered');
      await clearAllCaches();
      await unregisterAllServiceWorkers();
      forceRefreshApp();
    }
  });

  // Add console commands for manual cleanup
  if (typeof window !== 'undefined') {
    (window as any).clearAppCache = async () => {
      await clearAllCaches();
      await unregisterAllServiceWorkers();
      console.log('[SW Helper] App cache cleared manually');
    };

    (window as any).forceAppRefresh = () => {
      clearAllCaches().then(() => {
        unregisterAllServiceWorkers().then(() => {
          forceRefreshApp();
        });
      });
    };
  }
};

export const handleServiceWorkerUpdate = (registration: ServiceWorkerRegistration): void => {
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // 在開發環境自動刷新，在生產環境詢問用戶
        if (isDevelopment()) {
          console.log('[SW Helper] Auto-refreshing in development mode');
          forceRefreshApp();
        } else {
          // 生產環境顯示更新提示
          const shouldUpdate = confirm('有新版本可用，是否要重新載入頁面？');
          if (shouldUpdate) {
            forceRefreshApp();
          }
        }
      }
    });
  });
};

export const registerServiceWorkerWithHelper = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      updateViaCache: 'none' // 確保 SW 本身不被快取
    });

    console.log('[SW Helper] Service Worker registered:', registration);

    // 設置更新處理
    handleServiceWorkerUpdate(registration);

    // 定期檢查更新（生產環境 5 分鐘，開發環境 10 秒）
    const updateInterval = isDevelopment() ? 10 * 1000 : 5 * 60 * 1000;
    setInterval(() => {
      registration.update();
    }, updateInterval);

    // 監聽控制器變更
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW Helper] Service Worker controller changed, reloading...');
      forceRefreshApp();
    });

    return registration;
  } catch (error) {
    console.error('[SW Helper] Service Worker registration failed:', error);
    return null;
  }
};
