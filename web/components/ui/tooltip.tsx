"use client";

import { Tooltip as ChakraTooltip, Portal } from "@chakra-ui/react";
import { forwardRef, ReactNode } from "react";

export interface TooltipProps extends ChakraTooltip.RootProps {
  content: ReactNode;
  contentProps?: ChakraTooltip.ContentProps;
}

/** Shows `content` when hovering or focusing `children`, which must accept a ref. */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  { children, content, contentProps, ...rest },
  ref,
) {
  return (
    <ChakraTooltip.Root {...rest}>
      <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
      <Portal>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content ref={ref} {...contentProps}>
            {content}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  );
});
