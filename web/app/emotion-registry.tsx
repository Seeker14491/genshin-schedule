"use client";

import { ReactNode, useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

/**
 * Collects the styles Chakra generates while server rendering and inserts them into the document head.
 * Without this, Emotion renders <style> tags next to components, which breaks hydration.
 */
const EmotionRegistry = ({ children }: { children: ReactNode }) => {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: "css" });

    // tells Emotion not to render <style> tags inline
    cache.compat = true;

    const insert = cache.insert;
    let inserted: { name: string; global: boolean }[] = [];

    cache.insert = (...args) => {
      const [selector, serialized] = args;

      if (cache.inserted[serialized.name] === undefined) {
        inserted.push({ name: serialized.name, global: !selector });
      }

      return insert(...args);
    };

    const flush = () => {
      const result = inserted;
      inserted = [];
      return result;
    };

    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();

    if (!names.length) {
      return null;
    }

    const globals: ReactNode[] = [];
    let styles = "";
    let dataEmotion = cache.key;

    for (const { name, global } of names) {
      const style = cache.inserted[name];

      if (typeof style !== "string") {
        continue;
      }

      if (global) {
        globals.push(
          <style key={name} data-emotion={`${cache.key}-global ${name}`} dangerouslySetInnerHTML={{ __html: style }} />,
        );
      } else {
        styles += style;
        dataEmotion += ` ${name}`;
      }
    }

    return (
      <>
        {globals}
        <style data-emotion={dataEmotion} dangerouslySetInnerHTML={{ __html: styles }} />
      </>
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
};

export default EmotionRegistry;
