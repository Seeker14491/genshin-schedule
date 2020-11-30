import React, { Dispatch, memo } from "react";
import { FaEye } from "react-icons/fa";
import { trackEvent } from "../../../../utils/umami";
import { useMap } from "react-leaflet";
import { Checkbox, HStack, Icon, Spacer } from "@chakra-ui/react";

const HideCheck = ({ value, setValue }: { value: boolean; setValue: Dispatch<boolean> }) => {
  const map = useMap();

  return (
    <HStack spacing={2}>
      <Icon as={FaEye} />

      <HStack as="label" spacing={2} cursor="pointer" flex={1}>
        <div>Hide temporarily</div>
        <Spacer />

        <Checkbox
          size="sm"
          isChecked={value}
          onChange={({ currentTarget: { checked } }) => {
            setValue(checked);

            checked && map.closePopup();
            trackEvent("map", "taskToggleHide");
          }}
        />
      </HStack>
    </HStack>
  );
};

export default memo(HideCheck);