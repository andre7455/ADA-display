/**
 * @typedef {object} WakeLockSentinel
 * @property {boolean} released
 * @property {() => Promise<void>} release
 */

/**
 * @typedef {Navigator & {
 *   wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> }
 * }} WakeLockNavigator
 */

/**
 * Requests a screen wake lock when supported, and reacquires it when the page becomes visible again.
 * @param {Document} [documentRef]
 * @param {Navigator} [navigatorRef]
 * @returns {() => void}
 */
export function keepScreenAwake(documentRef = document, navigatorRef = navigator) {
  /** @type {WakeLockSentinel | undefined} */
  let lock;
  let stopped = false;

  async function requestLock() {
    const { wakeLock } = /** @type {WakeLockNavigator} */ (navigatorRef);

    if (!wakeLock || stopped || documentRef.visibilityState !== 'visible') {
      return;
    }

    try {
      lock = await wakeLock.request('screen');
    } catch {
      lock = undefined;
    }
  }

  function handleVisibilityChange() {
    if (documentRef.visibilityState === 'visible') {
      requestLock();
    }
  }

  documentRef.addEventListener('visibilitychange', handleVisibilityChange);
  requestLock();

  return () => {
    stopped = true;
    documentRef.removeEventListener('visibilitychange', handleVisibilityChange);

    if (lock && !lock.released) {
      lock.release();
    }
  };
}
