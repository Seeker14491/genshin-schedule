import { ReactNode } from "react";
import { Stack, StackSeparator } from "@chakra-ui/react";

/** Bordered container used for widgets and lists. */
const Panel = ({ children, divide, padding = 4 }: { children?: ReactNode; divide?: boolean; padding?: number }) => {
  return (
    <Stack
      bg="bg"
      borderWidth="1px"
      borderColor="border"
      borderRadius="md"
      p={padding}
      gap={divide ? padding : 0}
      separator={divide ? <StackSeparator /> : undefined}
    >
      {children}
    </Stack>
  );
};

export default Panel;
