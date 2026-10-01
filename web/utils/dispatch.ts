import { Dispatch, SetStateAction, useCallback } from "react";

export function useListItemDispatch<T extends { id: string }>(
  items: T[],
  setItems: Dispatch<SetStateAction<T[]>>,
  id: string
): [T | undefined, Dispatch<SetStateAction<T>>, () => void] {
  return [
    items.find((item) => item.id === id),
    useCallback(
      (newItem) => {
        setItems((items) => {
          return items.map((oldItem) => {
            if (oldItem.id === id) {
              if (typeof newItem === "function") {
                return newItem(oldItem);
              } else {
                return newItem;
              }
            } else {
              return oldItem;
            }
          });
        });
      },
      [setItems, id]
    ),
    useCallback(() => {
      setItems((items) => {
        return items.filter((item) => item.id !== id);
      });
    }, [setItems, id]),
  ];
}
