import React, { memo } from "react";
import { Button, Icon } from "@chakra-ui/react";
import { setAuthToken } from "../../../utils/api";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";
import { LogOut } from "react-feather";

const SignOutButton = () => {
  const router = useRouter();

  return (
    <Button
      leftIcon={<Icon as={LogOut} />}
      onClick={() => {
        setAuthToken(undefined);

        setTimeout(() => router.push("/"));
      }}
    >
      <FormattedMessage defaultMessage="Sign out" />
    </Button>
  );
};

export default memo(SignOutButton);
