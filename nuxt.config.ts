// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({


modules: [
  '@nuxtjs/tailwindcss',
],

    app: {
        head: {
          script: [{ src: 'main.prod.js' }],
        },
      }
    

    })
