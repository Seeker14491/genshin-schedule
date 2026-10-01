"use client";

import { ReactNode } from "react";
import { CloseButton, Dialog, Heading, HStack, Kbd, List, Portal, Stack, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { CommandIcon } from "lucide-react";
import { useHotkey } from "@/utils/hotkeys";

const ShortcutHelp = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
  useHotkey(
    (e) => e.key === "k",
    () => setOpen(true),
  );

  return (
    <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)} size="lg">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title asChild>
                <HStack>
                  <CommandIcon size="1em" />
                  <FormattedMessage defaultMessage="Keyboard shortcuts" />
                </HStack>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>

            <Dialog.Body pb={6}>
              <Stack gap={4}>
                <Category heading={<FormattedMessage defaultMessage="Resin calculator" />}>
                  <Text mb={2}>
                    Note: These shortcuts require a corresponding resin button to be available. Resin buttons can be
                    configured in settings.
                  </Text>
                  <KeyHint>
                    <FormattedMessage
                      defaultMessage="Subtract {values}"
                      values={{
                        values: (
                          <>
                            20 <Kbd>2</Kbd>, etc.
                          </>
                        ),
                      }}
                    />
                  </KeyHint>
                  <KeyHint>
                    <FormattedMessage
                      defaultMessage="Add {values}"
                      values={{
                        values: (
                          <>
                            20 <Kbd>shift+2</Kbd>, etc.
                          </>
                        ),
                      }}
                    />
                  </KeyHint>
                </Category>

                <Category heading={<FormattedMessage defaultMessage="Other" />}>
                  <KeyHint shortcut="k">
                    <FormattedMessage defaultMessage="Show keyboard shortcuts" />
                  </KeyHint>
                </Category>
              </Stack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

const Category = ({ heading, children }: { heading?: ReactNode; children?: ReactNode }) => {
  return (
    <Stack gap={2}>
      <Heading size="md">{heading}</Heading>
      <List.Root ps={4}>{children}</List.Root>
    </Stack>
  );
};

const KeyHint = ({ children, shortcut }: { children?: ReactNode; shortcut?: string }) => {
  return (
    <List.Item>
      <HStack gap={2} align="baseline">
        <div>{children}</div>
        {shortcut && <Kbd>{shortcut}</Kbd>}
      </HStack>
    </List.Item>
  );
};

export default ShortcutHelp;
