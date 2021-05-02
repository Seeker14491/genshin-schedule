import React, { memo, useMemo } from "react";
import { ArtifactSearch } from "./search";
import Icon from "./Icon";
import { Grid, Heading, VStack } from "@chakra-ui/react";
import { useConfig } from "../../../utils/config";
import { FormattedMessage } from "react-intl";

const ArtifactList = () => {
  const [search] = useConfig("customizeQuery");
  const all = useMemo(() => ArtifactSearch.search("").sort((a, b) => a.name.localeCompare(b.name)), []);
  const results = useMemo(() => new Set(ArtifactSearch.search(search)), [search]);

  return (
    <VStack align="stretch" spacing={4} d={results.size ? undefined : "none"}>
      <Heading size="md">
        <FormattedMessage id="artifacts" />
      </Heading>

      <Grid templateColumns="repeat(auto-fill, minmax(7rem, 1fr))" gap={2}>
        {all.map((artifact) => (
          <Icon key={artifact.name} visible={results.has(artifact)} artifact={artifact} />
        ))}
      </Grid>
    </VStack>
  );
};

export default memo(ArtifactList);
