/** Share channels. Each returns a Promise<boolean> (true = handed off successfully). */

export const canNativeShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export function shareViaWhatsApp(text) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  return Promise.resolve(true);
}

export function shareViaEmail({ subject, body }) {
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return Promise.resolve(true);
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for insecure contexts / older browsers.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

export async function shareNative({ title, text, url }) {
  if (!canNativeShare()) return false;
  try {
    await navigator.share({ title, text, url });
    return true;
  } catch (err) {
    if (err?.name !== 'AbortError') console.warn('[share] native share failed', err);
    return false;
  }
}
