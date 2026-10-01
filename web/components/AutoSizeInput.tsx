"use client";

import { ComponentProps, forwardRef, useState } from "react";
import { chakra } from "@chakra-ui/react";

/** Borderless number input that is only as wide as its value. Selects its contents when clicked. */
const AutoSizeInput = forwardRef<
  HTMLInputElement,
  Omit<ComponentProps<typeof chakra.input>, "value"> & { value: number }
>(function AutoSizeInput({ value, onFocus, onBlur, onClick, ...props }, ref) {
  const [focus, setFocus] = useState(false);

  return (
    <chakra.input
      ref={ref}
      type="number"
      textAlign="center"
      bg="inherit"
      borderRadius="sm"
      // digits are all 1ch wide with tabular numbers, so the width fits the value exactly
      fontVariantNumeric="tabular-nums"
      style={{ width: `calc(${value.toString().length}ch + ${focus ? 8 : 0}px)` }}
      cursor={focus ? undefined : "pointer"}
      css={{
        appearance: "textfield",
        "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": { appearance: "none", margin: 0 },
      }}
      value={value.toString()}
      onFocus={(e) => {
        setFocus(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        onBlur?.(e);
      }}
      onClick={(e) => {
        e.currentTarget.select();
        onClick?.(e);
      }}
      {...props}
    />
  );
});

export default AutoSizeInput;
