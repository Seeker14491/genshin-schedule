# Translations

The site is translated into the 15 languages that Genshin Impact itself supports, using [Paraglide](https://paraglidejs.com/).

Each language has a file here, named after its code (e.g. [en-US.json](en-US.json), [ja.json](ja.json)). Every message has a name, which the code uses to show it:

```json
{
  "resin_full": "Your resins are full.",
  "until_reset": "{duration} until reset"
}
```

```svelte
<script lang="ts">
  import { m } from "#lib/paraglide/messages.js";
</script>

<div>
  <p>{m.resin_full()}</p>
  <p>{m.until_reset({ duration })}</p>
</div>
```

Messages are compiled into typed functions, so a misspelled name or a missing parameter is an error in `npm run check`, and a test checks that every language has every message with the same parameters as English.

## Adding or changing a message

1. Add or change the message in [en-US.json](en-US.json).
2. Add or update it in every other language file. A test fails until every language has it.

Text in `{braces}` is a parameter. Keep parameter names unchanged in translations, but move them wherever the language needs them.

Messages that depend on a number can have plural forms. English uses this for `resin_gain` ("+1 resin" and "+5 resins"):

```json
{
  "resin_gain": [
    {
      "declarations": ["input value", "local valuePlural = value: plural"],
      "selectors": ["valuePlural"],
      "match": { "valuePlural=one": "+{value} resin", "valuePlural=*": "+{value} resins" }
    }
  ]
}
```

The forms (`one`, `few`, `many`, `*` for everything else) are the [plural categories](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) of each language. Languages that don't need different forms can use a plain message instead.

Durations such as "2 hours" are translated by the browser, not here.

## Game terms

[glossary.json](glossary.json) lists the official names of game terms that appear on the site, such as Original Resin and Serenitea Pot, in every language. Translations should use these names. They come from the "Other Languages" section of each term's page on the [Genshin Impact Fandom wiki](https://genshin-impact.fandom.com/). Some terms have no page of their own, so a related page is used; the glossary notes where.

To update the glossary, or to add a term to it (in [scripts/glossary.mjs](../scripts/glossary.mjs)), run:

```shell
npm run glossary
```

## Languages

Languages are listed in [src/lib/languages.ts](../src/lib/languages.ts), which also has the names shown in settings, and in [project.inlang/settings.json](../project.inlang/settings.json), which tells Paraglide which files to compile.
