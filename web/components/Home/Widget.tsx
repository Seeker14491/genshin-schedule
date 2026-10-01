"use client";

import { ReactNode } from "react";
import { Box, Collapsible } from "@chakra-ui/react";
import { ChevronRightIcon } from "lucide-react";
import { Config, useConfig } from "@/utils/config";

/** Collapsible home page section. Whether it's collapsed is saved in the config. */
const Widget = ({
  type,
  heading,
  children,
}: {
  type: keyof Config["hiddenWidgets"];
  heading?: ReactNode;
  children?: ReactNode;
}) => {
  const [hidden, setHidden] = useConfig("hiddenWidgets");
  const open = !hidden[type];

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={(e) => setHidden((widgets) => ({ ...widgets, [type]: !e.open }))}
      unmountOnExit
    >
      <Collapsible.Trigger
        display="flex"
        alignItems="center"
        gap={2}
        fontSize="xl"
        fontWeight="bold"
        fontFamily="heading"
        whiteSpace="pre"
        cursor="pointer"
        color={open ? undefined : { base: "gray.200", _dark: "gray.700" }}
        _hover={{ textDecoration: "underline" }}
      >
        {heading}
        <ChevronRightIcon
          size="1em"
          style={{
            transition: "transform .1s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: open ? "rotate(90deg)" : undefined,
          }}
        />
      </Collapsible.Trigger>

      <Collapsible.Content>
        <Box mt={4} className="group">
          {children}
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

/** Only shows its children while the widget is hovered or focused, or always on touch screens. */
export const HoverReveal = ({ children }: { children?: ReactNode }) => {
  return (
    <Box
      opacity={0}
      transition="opacity 0.2s"
      _groupHover={{ opacity: 1 }}
      _groupFocusWithin={{ opacity: 1 }}
      css={{ "@media (any-pointer: coarse)": { opacity: 1 } }}
    >
      {children}
    </Box>
  );
};

export default Widget;
