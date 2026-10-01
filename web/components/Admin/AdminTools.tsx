"use client";

import { useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { Button, CloseButton, Dialog, Field, Input, Portal, Stack } from "@chakra-ui/react";
import { LogInIcon } from "lucide-react";
import type { User } from "@/utils/api";
import { createApiClient, setAuthToken } from "@/utils/auth";
import { toaster } from "../ui/toaster";

/** Tools for administrators. Only shown to users with the admin flag. */
const AdminTools = ({ user }: { user: User | null }) => {
  return (
    <Stack gap={4} align="start">
      <div>Administrator tools:</div>
      {user?.isAdmin ? <DirectSignInButton /> : <div>You do not have permission to view this page.</div>}
    </Stack>
  );
};

/** Signs in as another user without their password, e.g. to help them reset it. */
const DirectSignInButton = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");

  return (
    <Dialog.Root size="lg">
      <Dialog.Trigger asChild>
        <Button variant="subtle">
          <LogInIcon />
          Direct sign in
        </Button>
      </Dialog.Trigger>

      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Direct sign in</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);

                try {
                  const { token } = await createApiClient().authBypass(username);

                  setAuthToken(token);
                  router.push("/home");
                } catch (e) {
                  toaster.create({ type: "error", title: "Error", description: (e as Error).message, closable: true });
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Dialog.Body>
                <Stack gap={4}>
                  <div>Sign in as another user, bypassing the usual authentication method.</div>

                  <Field.Root>
                    <Field.Label>Username</Field.Label>
                    <Input
                      placeholder="Username"
                      autoComplete="off"
                      value={username}
                      onChange={({ currentTarget: { value } }) => setUsername(value)}
                    />
                  </Field.Root>
                </Stack>
              </Dialog.Body>

              <Dialog.Footer>
                <Button type="submit" colorPalette="blue" loading={loading}>
                  <LogInIcon />
                  Sign in
                </Button>

                <Dialog.ActionTrigger asChild>
                  <Button variant="subtle">Cancel</Button>
                </Dialog.ActionTrigger>
              </Dialog.Footer>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default AdminTools;
