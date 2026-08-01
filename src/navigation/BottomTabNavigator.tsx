import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { HomeScreen, MemoriesScreen, SettingsScreen, TripsScreen } from "@/screens";
import { useAppTheme } from "@/theme";

import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const TAB_ICONS: Record<keyof RootTabParamList, { focused: IconName; unfocused: IconName }> = {
  Home: { focused: "map", unfocused: "map-outline" },
  Trips: { focused: "road-variant", unfocused: "road-variant" },
  Memories: { focused: "image-multiple", unfocused: "image-multiple-outline" },
  Settings: { focused: "cog", unfocused: "cog-outline" },
};

/**
 * The app's primary navigation surface. Adding a fifth tab is a matter of
 * adding a route here + to `RootTabParamList` — each tab screen can later
 * grow its own stack navigator without changing this file.
 */
export function BottomTabNavigator() {
  const theme = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.palette.primary,
        tabBarInactiveTintColor: theme.palette.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.palette.surface,
          borderTopColor: theme.palette.border,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name as keyof RootTabParamList];
          return (
            <MaterialCommunityIcons
              name={focused ? icons.focused : icons.unfocused}
              color={color}
              size={size}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Memories" component={MemoriesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
