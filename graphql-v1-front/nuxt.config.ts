// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: {enabled: false},
  modules: ['@nuxt/image'],
  css: ['@/assets/scss/main.scss'],
  runtimeConfig: {
    craftGraphqlEndpoint: process.env.NUXT_CRAFT_GRAPHQL_ENDPOINT,
    craftGraphqlToken: process.env.NUXT_CRAFT_GRAPHQL_TOKEN,
    /** Comma-separated GraphQL typenames for `sections` rows that expose `bodyContent` (see `CRAFT_GRAPHQL_SECTIONS_BODY_ROW_TYPENAMES` in server/config/craft-cms.ts). */
    craftSectionsBodyRowGraphqlTypenames:
      process.env.NUXT_CRAFT_SECTIONS_BODY_ROW_GRAPHQL_TYPENAMES ?? '',
  },
  ssr:true,
});
