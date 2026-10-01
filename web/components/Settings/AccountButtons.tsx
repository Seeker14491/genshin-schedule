"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import {
  Alert,
  Box,
  Button,
  CloseButton,
  Code,
  Dialog,
  Field,
  Input,
  Portal,
  Stack,
  Textarea,
  useClipboard,
} from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { CheckIcon, CodeIcon, CopyIcon, LogOutIcon, PencilIcon, UploadIcon, UserIcon } from "lucide-react";
import type { User } from "@/utils/api";
import { createApiClient, setAuthToken } from "@/utils/auth";
import { getDefaultConfig, useConfigs } from "@/utils/config";
import { toaster } from "../ui/toaster";

function showError(description: string) {
  toaster.create({ type: "error", title: "Error", description, closable: true });
}

const SettingsDialog = ({
  open,
  setOpen,
  trigger,
  title,
  children,
  footer,
  onSubmit,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  trigger: ReactNode;
  title: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
}) => {
  const body = (
    <>
      <Dialog.Body>{children}</Dialog.Body>
      <Dialog.Footer>{footer}</Dialog.Footer>
    </>
  );

  return (
    <Dialog.Root size="lg" open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            {onSubmit ? <form onSubmit={onSubmit}>{body}</form> : body}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

/** Shows the config as JSON for backup, and allows overwriting it. */
export const ConfigExportButton = () => {
  const [configs, setConfigs] = useConfigs();
  const [data, setData] = useState("");
  const clipboard = useClipboard({ value: data });
  const [open, setOpen] = useState(false);

  return (
    <SettingsDialog
      open={open}
      setOpen={(open) => {
        // show the latest data every time the dialog is opened
        if (open) {
          setData(JSON.stringify(configs, null, 2));
        }

        setOpen(open);
      }}
      trigger={
        <Button variant="subtle">
          <CodeIcon />
          <FormattedMessage defaultMessage="Manage data" />
        </Button>
      }
      title={<FormattedMessage defaultMessage="Manage data" />}
      footer={
        <>
          <Button
            colorPalette="red"
            onClick={() => {
              try {
                const parsed = JSON.parse(data);

                if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                  throw new Error();
                }

                setConfigs({ ...getDefaultConfig(Date.now()), ...parsed });
                setOpen(false);
              } catch {
                showError("Input is invalid.");
              }
            }}
          >
            <PencilIcon />
            <FormattedMessage defaultMessage="Overwrite" />
          </Button>

          <Button variant="subtle" onClick={clipboard.copy}>
            {clipboard.copied ? <CheckIcon /> : <CopyIcon />}
            {clipboard.copied ? (
              <FormattedMessage defaultMessage="Copied" />
            ) : (
              <FormattedMessage defaultMessage="Copy" />
            )}
          </Button>
        </>
      }
    >
      <Stack gap={4}>
        <Alert.Root status="warning">
          <Alert.Indicator />
          <Alert.Title>
            <FormattedMessage defaultMessage="Input is not validated. Corrupted input can make data recovery impossible." />
          </Alert.Title>
        </Alert.Root>

        <Box>
          <FormattedMessage defaultMessage="You can export your account data for backup and restore." />{" "}
          <strong>
            <FormattedMessage defaultMessage="This action cannot be undone." />
          </strong>
        </Box>

        <Textarea
          value={data}
          onChange={({ currentTarget: { value } }) => setData(value)}
          h="lg"
          fontFamily="mono"
          fontSize="sm"
        />
      </Stack>
    </SettingsDialog>
  );
};

/** Changes the signed-in user's username and password. */
export const AccountManageButton = ({ user }: { user: User }) => {
  const { formatMessage } = useIntl();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <SettingsDialog
      open={open}
      setOpen={setOpen}
      trigger={
        <Button variant="subtle">
          <UserIcon />
          <FormattedMessage defaultMessage="Manage account" />
        </Button>
      }
      title={<FormattedMessage defaultMessage="Manage account" />}
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
          const { token } = await createApiClient().updateAuth({ username, password });

          setAuthToken(token);
          setOpen(false);
          router.refresh();
        } catch (e) {
          showError((e as Error).message);
        } finally {
          setLoading(false);
        }
      }}
      footer={
        <>
          <Button type="submit" colorPalette="red" loading={loading}>
            <UploadIcon />
            <FormattedMessage defaultMessage="Submit" />
          </Button>

          <Dialog.ActionTrigger asChild>
            <Button variant="subtle">
              <FormattedMessage defaultMessage="Cancel" />
            </Button>
          </Dialog.ActionTrigger>
        </>
      }
    >
      <Stack gap={4}>
        <div>
          <FormattedMessage defaultMessage="You can change your account username and password." />
        </div>

        <Field.Root required>
          <Field.Label>
            <FormattedMessage defaultMessage="Username" />
            <Field.RequiredIndicator />
          </Field.Label>

          <Input
            placeholder={formatMessage({ defaultMessage: "New username" })}
            autoComplete="username"
            value={username}
            onChange={({ currentTarget: { value } }) => setUsername(value)}
          />
        </Field.Root>

        <Field.Root required>
          <Field.Label>
            <FormattedMessage defaultMessage="Password" />
            <Field.RequiredIndicator />
          </Field.Label>

          <Input
            type="password"
            placeholder={formatMessage({ defaultMessage: "New password" })}
            autoComplete="new-password"
            value={password}
            onChange={({ currentTarget: { value } }) => setPassword(value)}
          />
        </Field.Root>

        <div>
          <FormattedMessage defaultMessage="Linked Discord ID" />: <Code>{user.discordUserId ?? "<null>"}</Code>
        </div>
      </Stack>
    </SettingsDialog>
  );
};

export const SignOutButton = () => {
  const router = useRouter();

  return (
    <Button
      variant="subtle"
      onClick={() => {
        setAuthToken(undefined);
        router.push("/");
      }}
    >
      <LogOutIcon />
      <FormattedMessage defaultMessage="Sign out" />
    </Button>
  );
};
