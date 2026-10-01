"use client";

import { ReactNode, useSyncExternalStore } from "react";
import NextLink from "next/link";
import { Box, Button, chakra, HStack, Input, InputGroup, Link, Spacer, Stack, useClipboard } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { BellIcon, CheckIcon, CopyIcon, LinkIcon, ListIcon } from "lucide-react";
import { isAuthenticated } from "@/utils/api";
import { getAuthToken } from "@/utils/auth";
import Bot from "@/assets/notifications/Bot.webp";
import Privacy from "@/assets/notifications/Privacy.webp";
import PrivacyDM from "@/assets/notifications/PrivacyDM.webp";
import Success from "@/assets/notifications/Success.webp";
import Panel from "../Panel";
import { Tooltip } from "../ui/tooltip";

export const DiscordBotInvite =
  "https://discord.com/oauth2/authorize?client_id=786827003164098610&scope=bot&permissions=379968";

const linkColor = { base: "blue.500", _dark: "blue.300" };

const Screenshot = ({ src }: { src: string }) => (
  <Box w="max-content" maxW="full">
    <chakra.img src={src} alt="" borderRadius="md" w="40%" minW="xs" maxW="full" />
  </Box>
);

/** Explains how to set up Discord notifications. */
const NotificationSetup = () => {
  const { formatMessage } = useIntl();

  return (
    <Panel divide>
      <HStack gap={2} fontSize="xl" fontWeight="bold">
        <BellIcon size="1em" />
        <div>
          <FormattedMessage defaultMessage="Notifications" />
        </div>

        <Spacer />
        <Tooltip content={formatMessage({ defaultMessage: "Queue" })}>
          <Link asChild color={linkColor} aria-label={formatMessage({ defaultMessage: "Queue" })}>
            <NextLink href="/home/notifications/queue">
              <ListIcon size="0.8em" />
            </NextLink>
          </Link>
        </Tooltip>
      </HStack>

      <Stack gap={4} align="start">
        <div>
          <FormattedMessage
            defaultMessage="Genshin Schedule has a Discord bot that can send you notifications when your resin reaches a certain level (configurable in {settings})."
            values={{
              settings: (
                <Link asChild color={linkColor}>
                  <NextLink href="/settings">
                    <FormattedMessage defaultMessage="Settings" />
                  </NextLink>
                </Link>
              ),
            }}
          />
        </div>

        <Screenshot src={Bot.src} />

        <Step>
          <FormattedMessage defaultMessage="1. Invite the bot to your server. The bot and you need to share a common server in order for the bot to be able to message you." />
          <Button asChild color="white" bg="#7289da" _hover={{ bg: "#677bc4" }}>
            <a href={DiscordBotInvite} target="_blank" rel="noopener noreferrer">
              <LinkIcon />
              <FormattedMessage defaultMessage="Invite the bot" />
            </a>
          </Button>
        </Step>

        <Step>
          <FormattedMessage defaultMessage="2. Make sure DMs from server members are enabled, otherwise the bot cannot message you." />
          <Screenshot src={Privacy.src} />
          <Screenshot src={PrivacyDM.src} />
        </Step>

        <Step>
          <FormattedMessage defaultMessage="3. Copy the following message (you must be signed in) and send it to the bot via DM. Don't share this message with anyone else, ever!" />
          <MessageDisplay />
        </Step>

        <Step>
          <FormattedMessage defaultMessage="The bot should inform you that the process succeeded:" />
          <Screenshot src={Success.src} />
        </Step>
      </Stack>
    </Panel>
  );
};

const Step = ({ children }: { children?: ReactNode }) => (
  <Stack gap={2} align="start" w="full">
    {children}
  </Stack>
);

const subscribeNever = () => () => {};

/** The message to send to the bot, which contains the user's auth token. */
const MessageDisplay = () => {
  const { formatMessage } = useIntl();

  // the token is read from the cookie in the browser so that it isn't included in the server-rendered page
  const token = useSyncExternalStore(subscribeNever, getAuthToken, () => undefined);
  const message = isAuthenticated(token)
    ? `enable ||${token}||`
    : formatMessage({ defaultMessage: "You are not signed in." });

  const clipboard = useClipboard({ value: message });

  return (
    <InputGroup
      w="full"
      startAddon={
        <Button variant="ghost" size="sm" onClick={clipboard.copy}>
          {clipboard.copied ? <CheckIcon /> : <CopyIcon />}
          {clipboard.copied ? <FormattedMessage defaultMessage="Copied" /> : <FormattedMessage defaultMessage="Copy" />}
        </Button>
      }
      startAddonProps={{ px: 1 }}
    >
      <Input readOnly value={message} />
    </InputGroup>
  );
};

export default NotificationSetup;
