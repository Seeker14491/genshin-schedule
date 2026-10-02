<script lang="ts">
  import { ApertureIcon, BellIcon, DivideIcon, GlobeIcon, ImageIcon, PercentIcon } from "@lucide/svelte";
  import type { User } from "#lib/utils/api.ts";
  import { parseResinButtons, ResinCap } from "#lib/db/resins.ts";
  import { isLanguage, Languages, LanguageNames } from "#lib/languages.ts";
  import type { Config } from "#lib/utils/config.ts";
  import { config } from "#lib/session.svelte.ts";
  import { m } from "#lib/paraglide/messages.js";
  import ResinNotification from "../home/ResinNotification.svelte";
  import ManageDataButton from "./ManageDataButton.svelte";
  import ManageAccountButton from "./ManageAccountButton.svelte";
  import SignOutButton from "./SignOutButton.svelte";
  import Field from "./Field.svelte";
  import Switch from "../ui/Switch.svelte";
  import Select from "../ui/Select.svelte";
  import Slider from "../ui/Slider.svelte";
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

  let resinButtons = $state(config.resinCalcButtons.map((v) => (v > 0 ? `+${v}` : `${v}`)).join(", "));
</script>

<div class="flex flex-col gap-4">
  <h1 class="font-heading text-style-xl font-semibold">{m.settings()}</h1>

  <div class="flex flex-col items-start gap-4">
    <Switch bind:checked={() => config.theme === "dark", (dark) => (config.theme = dark ? "dark" : "light")}>
      {#snippet label()}
        <span class="flex items-center gap-2"><ApertureIcon size="1em" />{m.dark_mode()}</span>
      {/snippet}
    </Switch>

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

    <Field id="estimation-mode" icon={DivideIcon} label={m.resin_estimation_mode()}>
      <Select
        id="estimation-mode"
        bind:value={
          () => config.resinEstimateMode, (value) => (config.resinEstimateMode = value as Config["resinEstimateMode"])
        }
      >
        <option value="time">{m.estimation_mode_time()}</option>
        <option value="value">{m.estimation_mode_value()}</option>
      </Select>
    </Field>

    <Field id="resin-buttons" icon={PercentIcon} label={m.resin_calculator_buttons()}>
      <input
        id="resin-buttons"
        class="{inputClass} max-w-xs"
        bind:value={resinButtons}
        oninput={() => (config.resinCalcButtons = parseResinButtons(resinButtons))}
      />
    </Field>

    <!-- keeps the queued notification up to date with the slider -->
    <ResinNotification />

    <Slider
      bind:value={() => config.resinNotifyMark, (value) => (config.resinNotifyMark = value)}
      min={10}
      max={ResinCap}
      step={10}
    >
      {#snippet label()}
        <span class="flex items-center gap-2"><BellIcon size="1em" />{m.notification_threshold()}</span>
      {/snippet}
    </Slider>

    <div class="flex flex-wrap gap-2">
      <ManageDataButton />
      {#if user}
        <ManageAccountButton {user} />
      {/if}
      <SignOutButton />
    </div>
  </div>
</div>
