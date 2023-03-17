// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({




    app: {
        head: {
          script: [{ src: 'main.prod.js' }],
        },
      }
    

    })
