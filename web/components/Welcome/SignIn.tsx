"use client";

import { useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { Alert, Button, Flex, Input, InputGroup, Stack, Text } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { KeyIcon, LogInIcon, UserIcon, UserXIcon } from "lucide-react";
import { AnonymousToken } from "@/utils/api";
import { createApiClient, setAuthToken } from "@/utils/auth";
import { Tooltip } from "../ui/tooltip";

/** Signs in, or creates an account if the username doesn't exist yet. */
const SignIn = () => {
  const { formatMessage } = useIntl();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  return (
    <Stack
      as="form"
      gap={4}
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
          const { token } = await createApiClient().auth({ username, password });

          setAuthToken(token);
          router.push("/home");
        } catch (e) {
          setError(e as Error);
          setLoading(false);
        }
      }}
    >
      {error && (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>
              <FormattedMessage defaultMessage="Error" />
            </Alert.Title>
            <Alert.Description>{error.message}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <Stack gap={2}>
        <InputGroup startElement={<UserIcon size="1em" />}>
          <Input
            variant="subtle"
            placeholder={formatMessage({ defaultMessage: "Username" })}
            aria-label={formatMessage({ defaultMessage: "Username" })}
            autoComplete="username"
            value={username}
            onChange={({ currentTarget: { value } }) => setUsername(value)}
          />
        </InputGroup>

        <InputGroup startElement={<KeyIcon size="1em" />}>
          <Input
            type="password"
            variant="subtle"
            placeholder={formatMessage({ defaultMessage: "Password" })}
            aria-label={formatMessage({ defaultMessage: "Password" })}
            autoComplete="current-password"
            value={password}
            onChange={({ currentTarget: { value } }) => {
              setPassword(value);

              if (!value) {
                setError(undefined);
              }
            }}
          />
        </InputGroup>
      </Stack>

      <Text fontSize="sm" color="gray.500">
        <FormattedMessage defaultMessage="Never reuse your HoYoverse password on Genshin-related websites." />
      </Text>

      <Flex wrap="wrap" gap={2}>
        <Button type="submit" loading={loading} colorPalette="blue" disabled={!username || !password}>
          <LogInIcon />
          <FormattedMessage defaultMessage="Submit" />
        </Button>

        <Tooltip
          content={<FormattedMessage defaultMessage="All data will be stored locally on the browser." />}
          closeOnClick={false}
        >
          <Button
            variant="subtle"
            disabled={loading}
            onClick={() => {
              setAuthToken(AnonymousToken);
              router.push("/home");
            }}
          >
            <UserXIcon />
            <FormattedMessage defaultMessage="Continue without signing in" />
          </Button>
        </Tooltip>
      </Flex>
    </Stack>
  );
};

export default SignIn;
