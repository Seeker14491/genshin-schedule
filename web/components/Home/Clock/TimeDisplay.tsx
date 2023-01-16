import React, { memo } from "react";
import { Heading } from "@chakra-ui/react";
import { useServerTime } from "../../../utils/time";

const TimeDisplay = () => {
  const time = useServerTime();

  const hour = time.hour.toString().padStart(2, "0");
  const minute = time.minute.toString().padStart(2, "0");
  const second = time.second.toString().padStart(2, "0");

  return (
    <Heading size="xl" suppressHydrationWarning>
      {hour}:{minute}:{second}
    </Heading>
  );
};

export default memo(TimeDisplay);
