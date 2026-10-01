"use client";

import { ReactNode, useState } from "react";
import { Field, Flex, Heading, HStack, Input, NativeSelect, Slider, Stack, Switch } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { ApertureIcon, BellIcon, DivideIcon, GlobeIcon, ImageIcon, PercentIcon } from "lucide-react";
import type { User } from "@/utils/api";
import { Config, useConfig } from "@/utils/config";
import { parseResinButtons, ResinCap } from "@/db/resins";
import { LanguageNames, Languages } from "@/langs";
import ResinNotification from "../Home/ResinNotification";
import { AccountManageButton, ConfigExportButton, SignOutButton } from "./AccountButtons";

const TranslationsUrl = "https://github.com/Seeker14491/genshin-schedule/tree/master/web/langs";

/** Settings page. `user` is only given for signed-in users. */
const Settings = ({ user }: { user?: User | null }) => {
  return (
    <Stack gap={4}>
      <Heading size="xl">
        <FormattedMessage defaultMessage="Settings" />
      </Heading>

      <Stack gap={4} align="start">
        <ThemeSwitch />
        <LanguageSwitch />
        <BackgroundSwitch />
        <ResinEstimateModeSwitch />
        <ResinCalcButtonInput />
        <ResinNotifyMarkSlider />

        <Flex wrap="wrap" gap={2}>
          <ConfigExportButton />
          {user && <AccountManageButton user={user} />}
          <SignOutButton />
        </Flex>
      </Stack>
    </Stack>
  );
};

const SettingLabel = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <Field.Label fontWeight="medium">
    <HStack gap={2}>
      {icon}
      {children}
    </HStack>
  </Field.Label>
);

const ThemeSwitch = () => {
  const [value, setValue] = useConfig("theme");

  return (
    <Switch.Root
      colorPalette="blue"
      checked={value === "dark"}
      onCheckedChange={({ checked }) => setValue(checked ? "dark" : "light")}
    >
      <Switch.HiddenInput />
      <Stack gap={1.5}>
        <Switch.Label fontWeight="medium">
          <HStack gap={2}>
            <ApertureIcon size="1em" />
            <FormattedMessage defaultMessage="Dark mode" />
          </HStack>
        </Switch.Label>
        <Switch.Control />
      </Stack>
    </Switch.Root>
  );
};

const Select = ({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) => (
  <NativeSelect.Root maxW="xs">
    <NativeSelect.Field value={value} onChange={(e) => onChange(e.currentTarget.value)}>
      {children}
    </NativeSelect.Field>
    <NativeSelect.Indicator />
  </NativeSelect.Root>
);

const LanguageSwitch = () => {
  const { formatMessage } = useIntl();
  const [value, setValue] = useConfig("language");

  return (
    <Field.Root>
      <SettingLabel icon={<GlobeIcon size="1em" />}>
        <FormattedMessage defaultMessage="Language" />
      </SettingLabel>

      <Select
        value={value}
        onChange={(value) => {
          if (value === "contribute") {
            window.open(TranslationsUrl);
          } else {
            setValue(value as Config["language"]);
          }
        }}
      >
        <option value="default">{formatMessage({ defaultMessage: "Default" })}</option>

        {Languages.map((lang) => (
          <option key={lang} value={lang}>
            {LanguageNames[lang]}
          </option>
        ))}

        <option value="contribute">({formatMessage({ defaultMessage: "Add new language" })})</option>
      </Select>
    </Field.Root>
  );
};

const BackgroundSwitch = () => {
  const { formatMessage } = useIntl();
  const [value, setValue] = useConfig("background");

  return (
    <Field.Root>
      <SettingLabel icon={<ImageIcon size="1em" />}>
        <FormattedMessage defaultMessage="Background" />
      </SettingLabel>

      <Select value={value} onChange={(value) => setValue(value as Config["background"])}>
        <option value="paimon">{formatMessage({ defaultMessage: "Paimon" })}</option>
        <option value="klee">{formatMessage({ defaultMessage: "Klee" })}</option>
        <option value="diluc">{formatMessage({ defaultMessage: "Diluc" })}</option>
        <option value="tartaglia">{formatMessage({ defaultMessage: "Tartaglia" })}</option>
        <option value="zhongli">{formatMessage({ defaultMessage: "Zhongli" })}</option>
        <option value="xiao">{formatMessage({ defaultMessage: "Xiao" })}</option>
        <option value="hutao">{formatMessage({ defaultMessage: "Hu Tao" })}</option>
        <option value="kazuha">{formatMessage({ defaultMessage: "Kazuha" })}</option>
        <option value="ayaka">{formatMessage({ defaultMessage: "Ayaka" })}</option>
        <option value="none">{formatMessage({ defaultMessage: "Disabled" })}</option>
      </Select>
    </Field.Root>
  );
};

const ResinEstimateModeSwitch = () => {
  const { formatMessage } = useIntl();
  const [value, setValue] = useConfig("resinEstimateMode");

  return (
    <Field.Root>
      <SettingLabel icon={<DivideIcon size="1em" />}>
        <FormattedMessage defaultMessage="Resin estimation mode" />
      </SettingLabel>

      <Select value={value} onChange={(value) => setValue(value as Config["resinEstimateMode"])}>
        <option value="time">{formatMessage({ defaultMessage: "Time steps (2h, 4h, 8h…)" })}</option>
        <option value="value">{formatMessage({ defaultMessage: "Value steps (20, 40, 60)" })}</option>
      </Select>
    </Field.Root>
  );
};

const ResinCalcButtonInput = () => {
  const [value, setValue] = useConfig("resinCalcButtons");
  const [text, setText] = useState(() => value.map((v) => (v > 0 ? `+${v}` : `${v}`)).join(", "));

  return (
    <Field.Root>
      <SettingLabel icon={<PercentIcon size="1em" />}>
        <FormattedMessage defaultMessage="Resin calculator buttons" />
      </SettingLabel>

      <Input
        maxW="xs"
        value={text}
        onChange={({ currentTarget: { value } }) => {
          setText(value);
          setValue(parseResinButtons(value));
        }}
      />
    </Field.Root>
  );
};

const ResinNotifyMarkSlider = () => {
  const [value, setValue] = useConfig("resinNotifyMark");

  return (
    <>
      {/* keeps the queued notification up to date with the slider */}
      <ResinNotification />

      <Slider.Root
        colorPalette="blue"
        w="sm"
        maxW="full"
        value={[value]}
        step={10}
        min={10}
        max={ResinCap}
        onValueChange={({ value }) => setValue(value[0])}
      >
        <HStack justify="space-between">
          <Slider.Label fontWeight="medium">
            <HStack gap={2}>
              <BellIcon size="1em" />
              <FormattedMessage defaultMessage="Send resin notification at" />
            </HStack>
          </Slider.Label>
          <Slider.ValueText />
        </HStack>
        <Slider.Control>
          <Slider.Track>
            <Slider.Range />
          </Slider.Track>
          <Slider.Thumbs />
        </Slider.Control>
      </Slider.Root>
    </>
  );
};

export default Settings;
