import { memo } from "react";
import { chakra, HStack, Icon, Link, Tooltip, VStack, useColorModeValue } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { Command, GitHub, HelpCircle } from "react-feather";

const Footer = ({ showShortcuts }: { showShortcuts?: () => void }) => {
  return (
    <VStack as="footer" align="stretch" spacing={4} p={4} color="gray.500" textAlign="center">
      <chakra.div fontSize="sm">
        <p>Genshin Schedule is not affiliated with or endorsed by HoYoverse.</p>
      </chakra.div>

      <chakra.div fontSize="sm">
        <p>
          <FormattedMessage
            defaultMessage="This site is a fork of the original, now offline, Genshin Schedule. This fork is mainained by {seekr}. The original was written by {chiya} and {contrib}."
            values={{
              seekr: (
                <Link
                  href="https://github.com/Seeker14491"
                  isExternal
                  color={useColorModeValue("pink.500", "pink.300")}
                >
                  Seekr
                </Link>
              ),
              chiya: (
                <Link href="https://chiya.dev" isExternal color={useColorModeValue("pink.500", "pink.300")}>
                  chiya.dev
                </Link>
              ),
              contrib: (
                <Link
                  href="https://github.com/chiyadev/genshin-schedule/graphs/contributors"
                  isExternal
                  color={useColorModeValue("pink.500", "pink.300")}
                >
                  <FormattedMessage defaultMessage="contributors" />
                </Link>
              ),
            }}
          />
        </p>
      </chakra.div>

      <HStack spacing={4} justify="center">
        {showShortcuts && (
          <Tooltip label={<FormattedMessage defaultMessage="Shortcuts" />}>
            <Link as="button" onClick={showShortcuts}>
              <Icon as={Command} />
            </Link>
          </Tooltip>
        )}

        <Tooltip label={<FormattedMessage defaultMessage="Help" />}>
          <Link href="https://github.com/chiyadev/genshin-schedule/wiki" isExternal>
            <Icon as={HelpCircle} />
          </Link>
        </Tooltip>

        <Tooltip label={<FormattedMessage defaultMessage="GitHub" />}>
          <Link href="https://github.com/Seeker14491/genshin-schedule" isExternal>
            <Icon as={GitHub} />
          </Link>
        </Tooltip>
      </HStack>
    </VStack>
  );
};

export default memo(Footer);
