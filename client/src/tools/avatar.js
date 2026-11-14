export const DEFAULT_AVATAR = import.meta.env.VITE_DEFAULT_AVATAR
  || 'https://api.dicebear.com/9.x/identicon/svg?seed=codeloop';

/**
 * Return the current user's profile, creating a default one on first use.
 * Concurrent callers may race to create it; a 409 means another request
 * won, so the profile is simply read again.
 */
export async function getOrCreateProfile(requestJson) {
  const res = await requestJson('/users/profile');
  if (res.status !== 404) return res;
  const created = await requestJson('/users/profile', 'POST', { profile_pic: DEFAULT_AVATAR, bio: 'Hello...' });
  return created.status === 409 ? requestJson('/users/profile') : created;
}
