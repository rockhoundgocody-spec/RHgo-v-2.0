export async function requestNotificationPermission(notificationApi = globalThis.Notification) {
  if (typeof notificationApi?.requestPermission !== 'function') return 'unsupported';
  try {
    return await notificationApi.requestPermission();
  } catch {
    return 'error';
  }
}

export function requestCurrentPosition(geolocation = globalThis.navigator?.geolocation, timeout = 8000) {
  if (typeof geolocation?.getCurrentPosition !== 'function') return Promise.resolve(false);

  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { timeout },
    );
  });
}
