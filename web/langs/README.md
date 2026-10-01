# Localization

This folder contains localization files that dictate how text is displayed on the website for a specific language.

We use [react-intl](https://formatjs.io/docs/react-intl/) as the localization framework. Text is written in English directly in the code, e.g. `<FormattedMessage defaultMessage="Settings" />`, and each message gets an ID derived from its English text at compile time (see [message-id.js](message-id.js)).

Translations use the [GNU gettext](https://www.gnu.org/software/gettext/) `.po` format, with the English text as `msgid`.

## Updating translation files

After adding or changing text in the code, run:

```shell
npm run i18n
```

This:

1. Extracts all messages from the code into the [en_US.pot](en_US.pot) template ([extract.mjs](extract.mjs)).
2. Updates every `.po` file to match: existing translations are kept, new messages are added untranslated, and messages that no longer exist are removed.
3. Generates the `.json` files loaded by the website ([generate.mjs](generate.mjs)).

Changing the English text of a message means its translations need to be redone, since translations are matched by the English text.

react-intl uses [ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/) syntax; a basic understanding of this syntax is necessary.

## Translating

You can use any text editor to edit `.po` files. Specialized editors such as [Poedit](https://poedit.net/) are also a popular choice. Run `npm run i18n` afterwards to regenerate the `.json` files.

Before [submitting](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) a localization, you should ensure that all fields have been translated and that they are both syntactically and semantically correct in the context of their usage.

You should follow the [development guide](../README.md#local-development) to start the website in your local environment to test localizations.

## Adding a language

1. Copy [en_US.pot](en_US.pot) to `<language>.po` and fill in the `Language` header.
2. Translate it and run `npm run i18n`.
3. Add the language to [index.ts](index.ts).
