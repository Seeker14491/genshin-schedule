import {
  Button,
  chakra,
  HStack,
  Icon,
  Link,
  Spacer,
  Tooltip,
  useColorModeValue,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import React, { memo } from "react";
import WhiteCard from "../../WhiteCard";
import Bot from "../../../assets/notifications/Bot.png";
import Privacy from "../../../assets/notifications/Privacy.png";
import PrivacyDM from "../../../assets/notifications/PrivacyDM.png";
import Success from "../../../assets/notifications/Success.png";
import MessageDisplay from "./MessageDisplay";
import NextLink from "next/link";
import { FormattedMessage } from "react-intl";
import { Bell, List, MessageSquare, Link as LinkIcon } from "react-feather";

export const DiscordServerInvite = "https://discord.gg/XdPQeEaBE7";
export const DiscordBotInvite =
  "https://discord.com/oauth2/authorize?client_id=786827003164098610&scope=bot&permissions=379968";

const Info = () => {
  return (
    <VStack flex={1} align="stretch" spacing={4}>
      <WhiteCard divide>
        <HStack spacing={2} fontSize="xl" fontWeight="bold">
          <Icon as={Bell} />
          <div>
            <FormattedMessage defaultMessage="Notifications" />
          </div>

          <Spacer />
          <Tooltip label={<FormattedMessage defaultMessage="Queue" />}>
            <span>
              <NextLink href="/home/notifications/queue" passHref>
                <Link color={useColorModeValue("blue.500", "blue.300")}>
                  <Icon as={List} fontSize="md" />
                </Link>
              </NextLink>
            </span>
          </Tooltip>
        </HStack>

        <VStack align="start" spacing={4}>
          <div>
            <FormattedMessage
              defaultMessage="Genshin Schedule has a Discord bot that can send you notifications when your resin reaches a certain level (configurable in {settings})."
              values={{
                settings: (
                  <Link href="/settings" color={useColorModeValue("blue.500", "blue.300")}>
                    <FormattedMessage defaultMessage="Settings" />
                  </Link>
                ),
              }}
            />
          </div>

          <chakra.img src={Bot.src} borderRadius="md" />

          <VStack align="start" spacing={2}>
            <div>
              <FormattedMessage
                defaultMessage={
                  "1. Join the {server}, or {invite} to your server. Either way, the bot and you need to share a common server in order for the bot to be able to message you."
                }
                values={{
                  server: (
                    <Link href={DiscordServerInvite} color={useColorModeValue("blue.500", "blue.300")} isExternal>
                      <FormattedMessage defaultMessage="Genshin Schedule server" />
                    </Link>
                  ),
                  invite: (
                    <Link href={DiscordBotInvite} color={useColorModeValue("blue.500", "blue.300")} isExternal>
                      <FormattedMessage defaultMessage="invite the bot" />
                    </Link>
                  ),
                }}
              />
            </div>

            <Wrap>
              <WrapItem>
                <Button
                  as="a"
                  href={DiscordServerInvite}
                  target="_blank"
                  leftIcon={<Icon as={MessageSquare} />}
                  color="white"
                  bg="#7289da"
                  colorScheme="none"
                >
                  <FormattedMessage defaultMessage="Join the server" />
                </Button>
              </WrapItem>

              <WrapItem>
                <Button
                  as="a"
                  href={DiscordBotInvite}
                  target="_blank"
                  leftIcon={<Icon as={LinkIcon} />}
                  color="white"
                  bg="#7289da"
                  colorScheme="none"
                >
                  <FormattedMessage defaultMessage="Invite the bot" />
                </Button>
              </WrapItem>
            </Wrap>
          </VStack>

          <VStack align="start" spacing={2}>
            <div>
              <FormattedMessage defaultMessage="2. Make sure DMs from server members are enabled, otherwise the bot cannot message you." />
            </div>

            <chakra.img src={Privacy.src} borderRadius="md" />
            <chakra.img src={PrivacyDM.src} borderRadius="md" />
          </VStack>

          <VStack align="start" spacing={2}>
            <div>
              <FormattedMessage defaultMessage="3. Copy the following message (you must be signed in) and send it to the bot via DM. Don't share this message with anyone else, ever!" />
            </div>

            <MessageDisplay />
          </VStack>

          <VStack align="start" spacing={2}>
            <div>
              <FormattedMessage defaultMessage="The bot should inform you that the process succeeded:" />
            </div>

            <chakra.img src={Success.src} borderRadius="md" />
          </VStack>
        </VStack>
      </WhiteCard>
    </VStack>
  );
};

export default memo(Info);
