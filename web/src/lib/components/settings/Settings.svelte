<script lang="ts">
  import { BellIcon, ClockIcon, GlobeIcon, ImageIcon, PercentIcon, SunMoonIcon } from "@lucide/svelte";
  import type { User } from "#lib/utils/api.ts";
  import { ResinCap } from "#lib/db/resin.ts";
  import { isLanguage, Languages, LanguageNames } from "#lib/languages.ts";
  import type { Config } from "#lib/utils/config.ts";
  import { config } from "#lib/session.svelte.ts";
  import { m } from "#lib/paraglide/messages.js";
  import ResinNotification from "../home/ResinNotification.svelte";
  import ManageDataButton from "./ManageDataButton.svelte";
  import ManageAccountButton from "./ManageAccountButton.svelte";
  import SignOutButton from "./SignOutButton.svelte";
  import Field from "./Field.svelte";
  import ResinButtonPicker from "./ResinButtonPicker.svelte";
  import Select from "../ui/Select.svelte";
  import { inputClass } from "../ui/input.ts";

  /** Only given for signed-in users. */
  let { user }: { user: User | null } = $props();

  const backgrounds: [Config["background"], () => string][] = [
    ["paimon", m.paimon],
    ["klee", m.klee],
    ["diluc", m.diluc],
    ["tartaglia", m.tartaglia],
    ["zhongli", m.zhongli],
    ["xiao", m.xiao],
    ["hutao", m.hu_tao],
    ["kazuha", m.kazuha],
    ["ayaka", m.ayaka],
    ["none", m.background_disabled],
  ];

  // saves the entered threshold as a whole number from 1 to the cap. The field shows the saved value when it doesn't
  // match what was entered (e.g. 300 becomes 200), except while it's empty, so that it can be cleared to type another
  function setNotifyMark(input: HTMLInputElement) {
    if (Number.isNaN(input.valueAsNumber)) return;

    config.resinNotifyMark = Math.min(ResinCap, Math.max(1, Math.round(input.valueAsNumber)));

    if (input.value !== config.resinNotifyMark.toString()) {
      input.value = config.resinNotifyMark.toString();
    }
  }
</script>

<div class="flex flex-col gap-4">
  <h1 class="font-heading text-style-xl font-semibold">{m.settings()}</h1>

  <div class="flex flex-col items-start gap-4">
    <Field id="theme" icon={SunMoonIcon} label={m.theme()}>
      <Select id="theme" bind:value={() => config.theme, (value) => (config.theme = value as Config["theme"])}>
        <option value="system">{m.theme_system()}</option>
        <option value="light">{m.theme_light()}</option>
        <option value="dark">{m.theme_dark()}</option>
      </Select>
    </Field>

    <Field id="language" icon={GlobeIcon} label={m.language()}>
      <Select
        id="language"
        bind:value={
          () => (isLanguage(config.language) ? config.language : "default"),
          (value) => (config.language = value as Config["language"])
        }
      >
        <option value="default">{m.language_default()}</option>
        {#each Languages as language (language)}
          <option value={language}>{LanguageNames[language]}</option>
        {/each}
      </Select>
    </Field>

    <Field id="time-zone" icon={ClockIcon} label={m.time_zone()}>
      <Select
        id="time-zone"
        bind:value={() => config.timeZone, (value) => (config.timeZone = value as Config["timeZone"])}
      >
        <option value="local">{m.local_time()}</option>
        <option value="server">{m.server_time()}</option>
      </Select>
    </Field>

    <Field id="background" icon={ImageIcon} label={m.background()}>
      <Select
        id="background"
        bind:value={() => config.background, (value) => (config.background = value as Config["background"])}
      >
        {#each backgrounds as [value, name] (value)}
          <option {value}>{name()}</option>
        {/each}
      </Select>
    </Field>

    <Field id="resin-buttons" icon={PercentIcon} label={m.resin_calculator_buttons()} group>
      <ResinButtonPicker />
    </Field>

    <!-- keeps the queued notification up to date with the threshold -->
    <ResinNotification />

    <Field id="notification-threshold" icon={BellIcon} label={m.notification_threshold()}>
      <input
        id="notification-threshold"
        type="number"
        class="{inputClass} max-w-xs"
        min="1"
        max={ResinCap}
        step="1"
        value={config.resinNotifyMark}
        oninput={(e) => setNotifyMark(e.currentTarget)}
        onblur={(e) => (e.currentTarget.value = config.resinNotifyMark.toString())}
      />
    </Field>

    <div class="flex flex-wrap gap-2">
      <ManageDataButton />
      {#if user}
        <ManageAccountButton {user} />
      {/if}
      <SignOutButton />
    </div>
  </div>
</div>
