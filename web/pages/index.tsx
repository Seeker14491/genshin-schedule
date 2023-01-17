import React, { memo, useRef } from "react";
import { GetServerSideProps } from "next";
import { Button, ButtonGroup, chakra, Heading, Icon, VStack } from "@chakra-ui/react";
import ConfigProvider from "../components/ConfigProvider";
import { createApiClient } from "../utils/api";
import Layout from "../components/Layout";
import ResinCalculator from "../assets/welcome/ResinCalculator.jpg";
import UserSignIn from "../components/Auth/UserSignIn";
import Favicon256x256 from "../public/android-chrome-256x256.png";
import { FormattedMessage } from "react-intl";
import NextImage from "next/image";
import { GitHub, LogIn } from "react-feather";
import { Language } from "../langs";

type Props = {
  language: Language | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const client = createApiClient(ctx);

  if (client.token) {
    return {
      redirect: {
        destination: "/home",
        permanent: false,
      },
    };
  }

  return {
    props: {
      language: client.language || null,
    },
  };
};

const Welcome = ({ language }: Props) => {
  const authRef = useRef<HTMLDivElement>(null);

  return (
    <ConfigProvider language={language}>
      <Layout header={false}>
        <VStack align="stretch" spacing={32} py={32} flex={1} maxW="568px" mx="auto">
          <VStack align="stretch" spacing={8}>
            <div>
              <chakra.img w={20} src={Favicon256x256.src} borderRadius="md" />
            </div>

            <VStack align="stretch" spacing={4}>
              <Heading>
                <FormattedMessage defaultMessage="Genshin Schedule" />
              </Heading>
              <div>
                <FormattedMessage defaultMessage="A simple app for keeping track of your resin in Genshin Impact." />
              </div>
              <div>
                <FormattedMessage defaultMessage="Mobile-friendly, dark mode, supports syncing across devices, and can ping you on Discord if your resin reaches a configurable level." />
              </div>
            </VStack>

            <ButtonGroup>
              <Button
                colorScheme="blue"
                leftIcon={<Icon as={LogIn} />}
                onClick={() => authRef.current?.scrollIntoView({ block: "start" })}
              >
                <FormattedMessage defaultMessage="Sign in" />
              </Button>

              <Button
                as="a"
                leftIcon={<Icon as={GitHub} />}
                href="https://github.com/Seeker14491/genshin-schedule"
                target="_blank"
              >
                <FormattedMessage defaultMessage="GitHub" />
              </Button>
            </ButtonGroup>
          </VStack>

          <VStack align="stretch" spacing={4}>
            <Heading size="lg">
              <FormattedMessage defaultMessage="Features" />
            </Heading>

            <VStack align="stretch" spacing={16}>
              <VStack align="stretch" spacing={8}>
                <VStack align="stretch" spacing={2}>
                  <Heading size="md">
                    <FormattedMessage defaultMessage="Resin calculator" />
                  </Heading>
                  <div>
                    <FormattedMessage defaultMessage="Tracks your resins and estimates when it will recharge without having to open the game." />
                  </div>
                </VStack>

                <div>
                  <NextImage src={ResinCalculator} />
                </div>
              </VStack>
            </VStack>
          </VStack>

          <VStack ref={authRef} align="stretch" spacing={8}>
            <VStack align="stretch" spacing={4}>
              <Heading size="lg">
                <FormattedMessage defaultMessage="Sign in" />
              </Heading>
              <div>
                <FormattedMessage defaultMessage="Signing in will enable synchronization across multiple devices. If you do not already have an account, it will be created automatically." />
              </div>
            </VStack>

            <UserSignIn />
          </VStack>
        </VStack>
      </Layout>
    </ConfigProvider>
  );
};

export default memo(Welcome);
