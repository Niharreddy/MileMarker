// Must be the first import in the app's entry point.
import "react-native-gesture-handler";

import React from "react";

import { AppProviders } from "@/app";
import { RootNavigator } from "@/navigation";

export default function App() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
