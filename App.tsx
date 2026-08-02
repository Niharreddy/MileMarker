// Must be the first import in the app's entry point.
import "react-native-gesture-handler";
// Polyfills crypto.getRandomValues, which `uuid` needs on React Native.
import "react-native-get-random-values";

// Registers the background location task. Must be imported unconditionally
// at the top level, not inside a component — the OS can relaunch the JS
// engine to deliver a location update while the app is backgrounded/killed,
// and the task has to already be defined before that event dispatches.
import "@/features/trips/backgroundLocationTask";

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
