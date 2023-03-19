// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({


modules: [
  '@pinia/nuxt',
  '@pinia-plugin-persistedstate/nuxt',
  '@nuxtjs/tailwindcss',
  '@nuxtjs/color-mode',
  'nuxt-icon',
],

    app: {
        head: {
          script: [{ src: 'main.prod.js' }],
        },
      }
    

    })
