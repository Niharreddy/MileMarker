import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { TripDetailScreen } from "@/screens/TripDetail";

import { BottomTabNavigator } from "./BottomTabNavigator";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Wraps the tab navigator so screens that need to appear over the tabs
 * (TripDetail today) can be pushed from anywhere — a search result on Home,
 * or a row on the Trips tab — with native back gesture/button support.
 * `TripDetail`'s header comes from the stack itself (not `AppHeader`)
 * specifically so the platform back control is free; it already themes
 * itself from `navigationLightTheme`/`navigationDarkTheme`.
 */
export function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={BottomTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{ title: "Trip" }}
      />
    </Stack.Navigator>
  );
}
