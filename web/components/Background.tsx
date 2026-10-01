"use client";

import { chakra } from "@chakra-ui/react";
import { useConfig } from "@/utils/config";
import { BackgroundImages } from "@/assets";

/** Faint character art in the bottom right corner of the page. */
const Background = () => {
  const [value] = useConfig("background");

  if (value === "none") {
    return null;
  }

  return (
    <chakra.img
      key={value}
      alt=""
      src={BackgroundImages[value]?.src}
      position="fixed"
      pointerEvents="none"
      userSelect="none"
      zIndex={-10}
      opacity={0.08}
      top={0}
      right={0}
      w="full"
      h="full"
      maxW="xl"
      objectFit="contain"
      objectPosition="100% 100%"
    />
  );
};

export default Background;
