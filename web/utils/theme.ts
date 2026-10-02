import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const fallbackFonts =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

// font variables are defined by next/font in app/layout.tsx
export const system = createSystem(
  defaultConfig,
  defineConfig({
    theme: {
      tokens: {
        fonts: {
          body: { value: `var(--font-inter), ${fallbackFonts}` },
          heading: { value: `var(--font-genshin), ${fallbackFonts}` },
        },
        fontSizes: {
          xs: { value: "10px" },
          sm: { value: "12px" },
          md: { value: "14px" },
          lg: { value: "16px" },
          xl: { value: "18px" },
        },
      },
      // keep the site's original colors rather than Chakra's black dark mode
      semanticTokens: {
        colors: {
          bg: {
            DEFAULT: { value: { _light: "{colors.white}", _dark: "#171923" } },
            panel: { value: { _light: "{colors.white}", _dark: "#171923" } },
            subtle: { value: { _light: "{colors.gray.50}", _dark: "#1a202c" } },
            muted: { value: { _light: "{colors.gray.100}", _dark: "#2d3748" } },
            emphasized: { value: { _light: "{colors.gray.200}", _dark: "#4a5568" } },
          },
          // used by gray buttons and badges, e.g. variant="subtle".
          // the dark values are the original buttons' whiteAlpha.200/300/400 over the #171923 background,
          // made opaque so that attached buttons, which overlap by 1px, don't show a brighter seam
          gray: {
            subtle: { value: { _light: "{colors.gray.100}", _dark: "#2a2b35" } },
            muted: { value: { _light: "{colors.gray.200}", _dark: "#3c3e46" } },
            emphasized: { value: { _light: "{colors.gray.300}", _dark: "#4f5058" } },
          },
          fg: {
            DEFAULT: { value: { _light: "#1a202c", _dark: "rgba(255, 255, 255, 0.92)" } },
          },
          border: {
            DEFAULT: { value: { _light: "{colors.gray.200}", _dark: "#2d3748" } },
          },
        },
      },
    },
    globalCss: {
      body: {
        fontSize: "md",
      },
    },
  }),
);
