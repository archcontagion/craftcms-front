/**
 * Proxies REST v1 API calls so the browser only hits same-origin (/api/v1/...),
 * avoiding CORS. The upstream base URL stays server-side.
 */
export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event);
  const upstreamBase = runtimeConfig.apiVersion1Endpoint as string | undefined;
  if (!upstreamBase) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Upstream API base URL is not configured (apiVersion1Endpoint).',
    });
  }

  const pathParam = getRouterParam(event, 'path');
  const relativePath = Array.isArray(pathParam)
    ? pathParam.join('/')
    : (pathParam ?? '');

  const requestUrl = getRequestURL(event);
  const normalizedBase = upstreamBase.replace(/\/?$/, '/');
  const upstreamUrl = `${normalizedBase}${relativePath}${requestUrl.search}`;

  return await $fetch(upstreamUrl);
});
