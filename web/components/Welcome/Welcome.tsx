"use client";

import { useRef } from "react";
import NextImage from "next/image";
import { Box, Button, chakra, Flex, Heading, Stack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { LogInIcon } from "lucide-react";
import { PaimonIcon } from "@/assets";
import ResinCalculator from "@/assets/welcome/ResinCalculator.webp";
import { GitHubIcon } from "../ui/icons";
import { RepositoryUrl } from "../Footer";
import SignIn from "./SignIn";

/** Landing page for visitors who haven't signed in. */
const Welcome = () => {
  const signInRef = useRef<HTMLDivElement>(null);

  return (
    <Stack gap={32} py={32} flex={1} maxW="568px" mx="auto">
      <Stack gap={8}>
        <chakra.img w={20} src={PaimonIcon.src} alt="" borderRadius="md" />

        <Stack gap={4}>
          <Heading as="h1" size={{ base: "3xl", md: "4xl" }}>
            <FormattedMessage defaultMessage="Genshin Schedule" />
          </Heading>
          <div>
            <FormattedMessage defaultMessage="A simple app for keeping track of your resin in Genshin Impact." />
          </div>
          <div>
            <FormattedMessage defaultMessage="Mobile-friendly, dark mode, supports syncing across devices, and can ping you on Discord if your resin reaches a configurable level." />
          </div>
        </Stack>

        <Flex gap={2}>
          <Button colorPalette="blue" onClick={() => signInRef.current?.scrollIntoView({ block: "start" })}>
            <LogInIcon />
            <FormattedMessage defaultMessage="Sign in" />
          </Button>

          <Button asChild variant="subtle">
            <a href={RepositoryUrl} target="_blank" rel="noopener noreferrer">
              <GitHubIcon />
              <FormattedMessage defaultMessage="GitHub" />
            </a>
          </Button>
        </Flex>
      </Stack>

      <Stack gap={4}>
        <Heading size={{ base: "2xl", md: "3xl" }}>
          <FormattedMessage defaultMessage="Features" />
        </Heading>

        <Stack gap={8}>
          <Stack gap={2}>
            <Heading size="xl">
              <FormattedMessage defaultMessage="Resin calculator" />
            </Heading>
            <div>
              <FormattedMessage defaultMessage="Tracks your resin and estimates when it will recharge without having to open the game." />
            </div>
          </Stack>

          <Box maxW={`${ResinCalculator.width / 2}px`}>
            <NextImage src={ResinCalculator} alt="" style={{ maxWidth: "100%", height: "auto" }} />
          </Box>
        </Stack>
      </Stack>

      <Stack ref={signInRef} gap={8}>
        <Stack gap={4}>
          <Heading size={{ base: "2xl", md: "3xl" }}>
            <FormattedMessage defaultMessage="Sign in" />
          </Heading>
          <div>
            <FormattedMessage defaultMessage="Signing in will enable synchronization across multiple devices. If you do not already have an account, it will be created automatically." />
          </div>
        </Stack>

        <SignIn />
      </Stack>
    </Stack>
  );
};

export default Welcome;
