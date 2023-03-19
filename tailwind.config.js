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
            "primary": "#6c25a3",
            "secondary": "#e5cb75",
            "accent": "#79eafc",
            "neutral": "#151221",
            "base-100": "#FFFFFF",
            "info": "#6F92EC",
            "success": "#145C37",
            "warning": "#F6D36A",
            "error": "#E98472",
          },
        },
        {
          dark: {
            "primary": "#6bc6c5",
            "secondary": "#a3dd52",          
            "accent": "#d1aeef",
            "neutral": "#293238",
            "base-100": "#312D39",
            "info": "#69BEDD",
            "success": "#28D780",
            "warning": "#BB7411",
            "error": "#EF1A25",
          },
        },
      ],
    },
  };