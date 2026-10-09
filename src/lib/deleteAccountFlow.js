import { removeAccountQueue } from '@/lib/offlineQueue';
import { dumpAllCaches } from '@/lib/dumpCache';
import { takePendingGuestReport } from '@/lib/guestDevice';

export async function deleteAccountRecords(client, onProgress = () => {}) {
  for (let batch = 0; batch < 100; batch++) {
    const response = await client.functions.invoke('deleteAccount', { confirmation: 'DELETE', acknowledge_retained_uploads: true });
    const result = response.data;
    if (!result || typeof result.complete !== 'boolean') throw new Error('Deletion did not confirm completion. Retry to finish.');
    onProgress(result);
    if (result.complete) {
      if (result.account_deleted !== true) throw new Error('Account removal is not yet confirmed. Retry to finish.');
      return result;
    }
  }
  throw new Error('Deletion made progress but is not finished. Retry to continue.');
}
export async function clearDeletedAccountDeviceData(user) {
  await removeAccountQueue(user);
  takePendingGuestReport();
  for (const key of ['rhgo_custom_albums', 'rhgo_settings', 'rhgo_last_gps', 'rhgo_user_name', 'clover_memory']) localStorage.removeItem(key);
  await dumpAllCaches();
}