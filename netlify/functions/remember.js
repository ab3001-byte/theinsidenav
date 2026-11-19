// Sets a long-lived first-party cookie so subscribers are not asked for their email again.
// Cookies set by the server are not wiped by Safari's 7-day limit on script-set storage.
exports.handler = async () => ({
  statusCode: 204,
  headers: {
    'Set-Cookie': 'tin_sub=1; Max-Age=34560000; Path=/; SameSite=Lax; Secure',
    'Cache-Control': 'no-store'
  },
  body: ''
});
