<script lang="ts">
  import { LogInIcon } from "@lucide/svelte";
  import { PaimonIcon } from "#lib/assets/index.ts";
  import ResinCalculator from "#lib/assets/welcome/ResinCalculator.webp";
  import { m } from "#lib/paraglide/messages.js";
  import Button from "../ui/Button.svelte";
  import GitHubIcon from "../ui/GitHubIcon.svelte";
  import SignIn from "./SignIn.svelte";

  const RepositoryUrl = "https://github.com/Seeker14491/genshin-schedule";

  let signIn: HTMLDivElement;
</script>

<!-- landing page for visitors who haven't signed in -->
<div class="mx-auto flex w-full max-w-[568px] flex-1 flex-col gap-32 py-32">
  <div class="flex flex-col gap-8">
    <img class="w-20 rounded-md" src={PaimonIcon} alt="" />

    <div class="flex flex-col gap-4">
      <h1 class="font-heading text-style-3xl font-semibold md:text-style-4xl">{m.genshin_schedule()}</h1>
      <div>{m.welcome_intro()}</div>
      <div>{m.welcome_features()}</div>
    </div>

    <div class="flex gap-2">
      <Button variant="solid" palette="blue" onclick={() => signIn.scrollIntoView({ block: "start" })}>
        <LogInIcon />
        {m.sign_in()}
      </Button>

      <Button href={RepositoryUrl} target="_blank" rel="noopener noreferrer">
        <GitHubIcon />
        GitHub
      </Button>
    </div>
  </div>

  <div class="flex flex-col gap-4">
    <h2 class="font-heading text-style-2xl font-semibold md:text-style-3xl">{m.features()}</h2>

    <div class="flex flex-col gap-8">
      <div class="flex flex-col gap-2">
        <h3 class="font-heading text-style-xl font-semibold">{m.resin_calculator()}</h3>
        <div>{m.welcome_resin_calculator()}</div>
      </div>

      <div class="max-w-[316px]">
        <img src={ResinCalculator} alt="" width="632" height="357" class="h-auto max-w-full" />
      </div>
    </div>
  </div>

  <div bind:this={signIn} class="flex flex-col gap-8">
    <div class="flex flex-col gap-4">
      <h2 class="font-heading text-style-2xl font-semibold md:text-style-3xl">{m.sign_in()}</h2>
      <div>{m.sign_in_description()}</div>
    </div>

    <SignIn />
  </div>
</div>
