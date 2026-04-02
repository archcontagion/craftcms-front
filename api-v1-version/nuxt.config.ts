// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: {enabled: false},
  experimental: {
    // Avoid client request to /_nuxt/builds/meta/dev.json in local dev.
    appManifest: false,
  },
  modules: ['@nuxt/image'],
  css: ['@/assets/scss/main.scss'],
  runtimeConfig: {
    // Upstream REST v1 base (e.g. https://host/api/v1/). Server-only — not exposed to the client.
    apiVersion1Endpoint:
      process.env.API_VERSION_1_ENDPOINT ||
      process.env.CRAFT_API_VERSION_1_ENDPOINT ||
      process.env.NUXT_PUBLIC_CRAFT_API_VERSION_1_ENDPOINT,
    public: {
      // Browser calls this same-origin path; Nitro proxies to apiVersion1Endpoint (see server/api/v1).
      apiClientBase: '/api/v1/',
    },
  },
  ssr: true,
});
