const STALE_BUILD_RELOAD_KEY = 'fes:stale-build-reload-at';
const RELOAD_GUARD_MS = 60_000;
const CACHE_BUST_PARAM = 'fesBuildReload';

const STALE_BUILD_ERROR_PATTERNS = [
  'Expected a JavaScript-or-Wasm module script',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'Loading chunk',
  'MIME type of "text/html"',
  'module script',
];

export function installStaleBuildRecovery(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('error', (event) => {
    if (isMissingScriptAsset(event) || isStaleBuildError(event.message)) {
      recoverFromStaleBuild();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (isStaleBuildError(errorText(event.reason))) {
      recoverFromStaleBuild();
    }
  });
}

function isMissingScriptAsset(event: Event): boolean {
  const target = event.target;

  return target instanceof HTMLScriptElement && target.src.includes('.js');
}

function isStaleBuildError(message: string | undefined): boolean {
  if (!message) {
    return false;
  }

  return STALE_BUILD_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

function errorText(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error ?? '');
}

function recoverFromStaleBuild(): void {
  const now = Date.now();
  const lastReloadAt = Number(sessionStorage.getItem(STALE_BUILD_RELOAD_KEY) ?? 0);

  if (Number.isFinite(lastReloadAt) && now - lastReloadAt < RELOAD_GUARD_MS) {
    return;
  }

  sessionStorage.setItem(STALE_BUILD_RELOAD_KEY, String(now));
  clearBrowserCaches();

  const url = new URL(window.location.href);
  url.searchParams.set(CACHE_BUST_PARAM, String(now));
  window.location.replace(url.toString());
}

function clearBrowserCaches(): void {
  if ('caches' in window) {
    window.caches.keys()
      .then((keys) => Promise.all(keys.map((key) => window.caches.delete(key))))
      .catch(() => undefined);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister())),
      )
      .catch(() => undefined);
  }
}
