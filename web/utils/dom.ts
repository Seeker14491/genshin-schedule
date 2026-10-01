import { useEffect, useState } from "react";

export function useMeasuredTextWidth(text: string, styleOrClass: any) {
  const [value, setValue] = useState<number>();
  const [update, setUpdate] = useState(0);

  useEffect(() => {
    // attempt to fix https://github.com/chiyadev/genshin-schedule/issues/2
    if ("fonts" in document) {
      (document as any).fonts.ready.then(() => setUpdate((i) => i + 1));
    }

    // font api is unreliable so force rerender periodically
    const interval = window.setInterval(() => setUpdate((i) => i + 1), 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const span = document.createElement("span");
    span.innerText = text;

    if (typeof styleOrClass === "string") {
      span.className = styleOrClass;
    } else {
      for (const key of Object.keys(styleOrClass)) {
        (span.style as any)[key] = styleOrClass[key];
      }
    }

    document.body.appendChild(span);
    const { width } = span.getBoundingClientRect();
    document.body.removeChild(span);

    setValue(width);
  }, [update, text, styleOrClass]);

  return value;
}
