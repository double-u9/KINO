import { getAccessToken } from './client';

async function uploadFile(endpoint: string, file: File): Promise<any> {
  const token = getAccessToken();
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
    body: form,
  });

  if (!res.ok) {
    // If 401, try refreshing and retry once
    if (res.status === 401) {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const { accessToken: newToken } = await refreshRes.json();
        const { setAccessToken } = await import('./client');
        setAccessToken(newToken);

        const retryForm = new FormData();
        retryForm.append('file', file);
        const retry = await fetch(endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${newToken}` },
          credentials: 'include',
          body: retryForm,
        });
        if (retry.ok) return retry.json();
        const retryErr = await retry.json().catch(() => ({ error: { message: 'Upload failed' } }));
        throw retryErr;
      }
    }
    const err = await res.json().catch(() => ({ error: { message: 'Upload failed' } }));
    throw err;
  }
  return res.json();
}

async function deleteUpload(endpoint: string): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(endpoint, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });

  if (!res.ok) {
    if (res.status === 401) {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const { accessToken: newToken } = await refreshRes.json();
        const { setAccessToken } = await import('./client');
        setAccessToken(newToken);

        const retry = await fetch(endpoint, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${newToken}` },
          credentials: 'include',
        });
        if (retry.ok) return;
      }
    }
  }
}

export const uploadAvatar = (file: File) => uploadFile('/api/upload/avatar', file);
export const removeAvatar = () => deleteUpload('/api/upload/avatar');
export const uploadBanner = (file: File) => uploadFile('/api/upload/banner', file);
export const removeBanner = () => deleteUpload('/api/upload/banner');
