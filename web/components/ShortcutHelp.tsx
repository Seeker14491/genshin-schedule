import React, { Dispatch, memo, ReactNode } from "react";
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/modal";
import { useHotkeys } from "react-hotkeys-hook";
import { Heading, HStack, Kbd, ListItem, UnorderedList, VStack } from "@chakra-ui/layout";
import { Box, Icon } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { Command } from "react-feather";

const ShortcutHelp = ({ open, setOpen }: { open: boolean; setOpen: Dispatch<boolean> }) => {
  useHotkeys("k", (e) => {
    setOpen(true);
    e.preventDefault();
  });

  return (
    <Modal isOpen={open} onClose={() => setOpen(false)} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={Command} />
            <div>
              <FormattedMessage defaultMessage="Keyboard shortcuts" />
            </div>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="start" spacing={4}>
            <Category heading={<FormattedMessage defaultMessage="Server clock" />}>
              <KeyHint shortcut={<FormattedMessage defaultMessage="left" />}>
                <FormattedMessage defaultMessage="Previous day" />
              </KeyHint>
              <KeyHint shortcut={<FormattedMessage defaultMessage="right" />}>
                <FormattedMessage defaultMessage="Next day" />
              </KeyHint>
              <KeyHint shortcut={<FormattedMessage defaultMessage="esc" />}>
                <FormattedMessage defaultMessage="Reset offset" />
              </KeyHint>
            </Category>

            <Category heading={<FormattedMessage defaultMessage="Resin calculator" />}>
              <p>
                Note: These shortcuts require a corresponding resin button to be available. Resin buttons can be
                configured in settings.
              </p>
              <Box padding={1} />
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
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const Category = ({ heading, children }: { heading?: ReactNode; children?: ReactNode }) => {
  return (
    <VStack align="start" spacing={2}>
      <Heading size="sm">{heading}</Heading>
      <UnorderedList pl={4}>{children}</UnorderedList>
    </VStack>
  );
};

const KeyHint = ({ children, shortcut }: { children?: ReactNode; shortcut?: ReactNode }) => {
  return (
    <ListItem>
      <HStack spacing={2} align="baseline">
        <div>{children}</div>

        {typeof shortcut !== "undefined" &&
          (Array.isArray(shortcut) ? (
            shortcut.map((shortcut, i) => <Kbd key={i}>{shortcut}</Kbd>)
          ) : (
            <Kbd>{shortcut}</Kbd>
          ))}
      </HStack>
    </ListItem>
  );
};

export default memo(ShortcutHelp);
