"use client";

import { ReactNode } from "react";
import NextLink from "next/link";
import { chakra, HStack, Link, Spacer } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { BellIcon, ChartPieIcon, CircleHelpIcon, SettingsIcon } from "lucide-react";
import { PaimonIcon } from "@/assets";
import { Tooltip } from "./ui/tooltip";

export const HelpUrl = "https://github.com/chiyadev/genshin-schedule/wiki";

const Header = () => {
  const { formatMessage } = useIntl();

  return (
    <HStack as="nav" p={4} gap={2}>
      <Link asChild fontFamily="heading" fontWeight="bold" flexShrink={0}>
        <NextLink href="/home">
          <HStack gap={2}>
            <chakra.img alt="" src={PaimonIcon.src} w={6} h={6} borderRadius="md" />
            <chakra.span fontSize="lg">
              <FormattedMessage defaultMessage="Genshin Schedule" />
            </chakra.span>
          </HStack>
        </NextLink>
      </Link>

      <Spacer />

      <HStack gap={4}>
        <IconLink href="/home/notifications" label={formatMessage({ defaultMessage: "Notifications" })}>
          <BellIcon size="1em" />
        </IconLink>
        <IconLink href="/home/statistics" label={formatMessage({ defaultMessage: "Statistics" })}>
          <ChartPieIcon size="1em" />
        </IconLink>
        <IconLink href={HelpUrl} external label={formatMessage({ defaultMessage: "Help" })}>
          <CircleHelpIcon size="1em" />
        </IconLink>
        <IconLink href="/settings" label={formatMessage({ defaultMessage: "Settings" })}>
          <SettingsIcon size="1em" />
        </IconLink>
      </HStack>
    </HStack>
  );
};

const IconLink = ({
  href,
  label,
  external,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  children: ReactNode;
}) => {
  return (
    <Tooltip content={label}>
      {external ? (
        <Link href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
          {children}
        </Link>
      ) : (
        <Link asChild aria-label={label}>
          <NextLink href={href}>{children}</NextLink>
        </Link>
      )}
    </Tooltip>
  );
};

export default Header;
