import React from "react";
import { Searchbar, type SearchbarProps } from "react-native-paper";

export type AppSearchBarProps = Omit<SearchbarProps, "onIconPress">;

/** Thin wrapper around Paper's Searchbar, kept for API consistency with the rest of `src/components`. */
export function AppSearchBar(props: AppSearchBarProps) {
  return <Searchbar {...props} />;
}
