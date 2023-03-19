module.exports = {
    plugins: [require("daisyui")],
    theme: {
      screens: {
        xs: "360px",
        xm: "480px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
    daisyui: {
      themes: [
        {
          light: {
            primary: "#4499dd",
            secondary: "#ffaa33",
            accent: "#88ccff",
            neutral: "#001133",
            "base-100": "#FFF",
            "base-200": "#FAFAFA",
            "base-300": "#EFEFEF",
            "base-400": "#E0E0E0",
            info: "#3ABFF8",
            success: "#36D399",
            warning: "#FBBD23",
            error: "#F87272",
          },
        },
        {
          dark: {
            primary: "#4499dd",
            secondary: "#ffaa33",
            accent: "#88ccff",
            neutral: "#191D24",
            "base-100": "#2A303C",
            "base-200": "#1D2027",
            "base-300": "#14151A",
            "base-400": "#0F1012",
            //"base-200": "#343842",
            //"base-300": "#393c46",
            //"base-400": "#3f404f",
            info: "#3ABFF8",
            success: "#36D399",
            warning: "#FBBD23",
            error: "#F87272",
          },
        },
      ],
    },
  };