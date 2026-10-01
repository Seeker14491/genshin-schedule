"use client";

import { HStack, Link, Stack, Text } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { CircleHelpIcon, CommandIcon } from "lucide-react";
import { Tooltip } from "./ui/tooltip";
import { GitHubIcon } from "./ui/icons";
import { HelpUrl } from "./Header";

export const RepositoryUrl = "https://github.com/Seeker14491/genshin-schedule";

const Footer = ({ showShortcuts }: { showShortcuts?: () => void }) => {
  const { formatMessage } = useIntl();
  const linkColor = { base: "pink.500", _dark: "pink.300" };

  return (
    <Stack as="footer" gap={4} p={4} color="gray.500" textAlign="center">
      <Text fontSize="sm">Genshin Schedule is not affiliated with or endorsed by HoYoverse.</Text>

      <Text fontSize="sm">
        <FormattedMessage
          defaultMessage="This site is a fork of the original, now offline, Genshin Schedule. This fork is mainained by {seekr}. The original was written by {chiya} and {contrib}."
          values={{
            seekr: (
              <Link href="https://github.com/Seeker14491" target="_blank" rel="noopener noreferrer" color={linkColor}>
                Seekr
              </Link>
            ),
            chiya: (
              <Link href="https://github.com/chiyadev" target="_blank" rel="noopener noreferrer" color={linkColor}>
                chiya.dev
              </Link>
            ),
            contrib: (
              <Link
                href="https://github.com/chiyadev/genshin-schedule/graphs/contributors"
                target="_blank"
                rel="noopener noreferrer"
                color={linkColor}
              >
                <FormattedMessage defaultMessage="contributors" />
              </Link>
            ),
          }}
        />
      </Text>

      <HStack gap={4} justify="center">
        {showShortcuts && (
          <Tooltip content={formatMessage({ defaultMessage: "Shortcuts" })}>
            <Link as="button" onClick={showShortcuts} aria-label={formatMessage({ defaultMessage: "Shortcuts" })}>
              <CommandIcon size="1em" />
            </Link>
          </Tooltip>
        )}

        <Tooltip content={formatMessage({ defaultMessage: "Help" })}>
          <Link
            href={HelpUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={formatMessage({ defaultMessage: "Help" })}
          >
            <CircleHelpIcon size="1em" />
          </Link>
        </Tooltip>

        <Tooltip content={formatMessage({ defaultMessage: "GitHub" })}>
          <Link href={RepositoryUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <GitHubIcon size="1em" />
          </Link>
        </Tooltip>
      </HStack>
    </Stack>
  );
};

export default Footer;
