"use client";

import { ReactNode, useEffect } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import { system } from "@/utils/theme";
import { Toaster } from "@/components/ui/toaster";
import EmotionRegistry from "./emotion-registry";

const Providers = ({ children }: { children: ReactNode }) => {
  // makes the site installable as an app on older browsers
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <EmotionRegistry>
      <ChakraProvider value={system}>
        {/* the theme is chosen in settings; ConfigProvider applies it. storageKey must not clash with config keys */}
        <ThemeProvider
          attribute="class"
          storageKey="color-mode"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <NextTopLoader color="var(--progress-color)" height={2} showSpinner={false} shadow={false} />
          <Toaster />
          {children}
        </ThemeProvider>
      </ChakraProvider>
    </EmotionRegistry>
  );
};

export default Providers;
