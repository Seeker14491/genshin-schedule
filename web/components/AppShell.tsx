"use client";

import { ReactNode, useState } from "react";
import { Box, Flex, Spacer } from "@chakra-ui/react";
import Header from "./Header";
import Footer from "./Footer";
import Background from "./Background";
import ShortcutHelp from "./ShortcutHelp";
import StatisticsUpdater from "./Statistics/StatisticsUpdater";

/** Page layout with header, footer and background. Must be rendered inside ConfigProvider. */
const AppShell = ({ header = true, children }: { header?: boolean; children?: ReactNode }) => {
  const [shortcuts, setShortcuts] = useState(false);

  return (
    <>
      <ShortcutHelp open={shortcuts} setOpen={setShortcuts} />
      <StatisticsUpdater />
      <Background />

      <Flex direction="column" minH="100vh" maxW="1200px" mx="auto">
        {header && <Header />}
        <Box as="main" p={4}>
          {children}
        </Box>
        <Spacer />
        <Footer showShortcuts={() => setShortcuts(true)} />
      </Flex>
    </>
  );
};

export default AppShell;
