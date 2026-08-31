import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { DriveDetailScreen, DriveOptionsMenu } from "@/screens/DriveDetail";
import { TripDetailScreen, TripOptionsMenu } from "@/screens/TripDetail";

import { BottomTabNavigator } from "./BottomTabNavigator";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Wraps the tab navigator so screens that need to appear over the tabs
 * (Drive and Trip detail) can be pushed from anywhere — a search result on
 * Home, or a row on the Drives/Trips tab — with native back gesture/button
 * support. Both detail screens' headers come from the stack itself (not
 * `AppHeader`) specifically so the platform back control is free; it
 * already themes itself from `navigationLightTheme`/`navigationDarkTheme`.
 */
export function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={BottomTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="Drive"
        component={DriveDetailScreen}
        options={({ navigation, route }) => ({
          title: "Drive",
          headerRight: () => <DriveOptionsMenu driveId={route.params.driveId} navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="Trip"
        component={TripDetailScreen}
        options={({ navigation, route }) => ({
          title: "Trip",
          headerRight: () => <TripOptionsMenu tripId={route.params.tripId} navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
}
