const EPC_BASE = 'https://epc.opendatacommunities.org/api/v1';

export async function onRequest({ request, env, params }) {
  const email = env.EPC_EMAIL;
  const key = env.EPC_KEY;

  if (!email || !key) {
    return new Response(
      JSON.stringify({ error: 'Backend credentials not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const path = (params.path || []).join('/');
  const requestUrl = new URL(request.url);
  const epcUrl = `${EPC_BASE}/${path}${requestUrl.search}`;

  const upstream = await fetch(epcUrl, {
    headers: {
      'Authorization': 'Basic ' + btoa(`${email}:${key}`),
      'Accept': 'application/json',
    },
  });

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
