import { Flex } from "@chakra-ui/react";
import React, { memo, ReactNode } from "react";
import styles from "./InfoContainer.module.css";

const InfoContainer = ({ main }: { main?: ReactNode; sub?: ReactNode }) => {
  return <Flex className={styles.container}>{main}</Flex>;
};

export default memo(InfoContainer);
