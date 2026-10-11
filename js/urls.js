export function safeUrl(value, kind = 'link') {
  if (typeof value !== 'string' || /[\u0000-\u001f\\]/.test(value)) throw new Error('Invalid URL');
  const url = new URL(value, 'https://portfolio.invalid/');
  if (url.username || url.password) throw new Error('URL credentials are not allowed');
  if (kind === 'video') {
    if (url.protocol !== 'https:' || !['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname) || !/^\/embed\/[\w-]+$/.test(url.pathname)) throw new Error('Only YouTube embed URLs are allowed');
  } else if (kind === 'image' || kind === 'asset') {
    if (url.origin !== 'https://portfolio.invalid' || value.startsWith('//') || !value.trim() || decodeURIComponent(value).split('/').includes('..')) throw new Error('Assets must use local paths');
  } else if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) throw new Error('Unsupported link protocol');
  if (url.origin === 'https://portfolio.invalid') return value;
  return url.href;
}
