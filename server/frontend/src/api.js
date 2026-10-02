export function csrf() {
  return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || '';
}
export async function api(path, options = {}) {
  const response = await fetch('/djangoapp/' + path, {
    ...options, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf(), ...options.headers }
  });
  let data;
  try { data = await response.json(); } catch { throw new Error('The service could not respond. Please try again.'); }
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}
