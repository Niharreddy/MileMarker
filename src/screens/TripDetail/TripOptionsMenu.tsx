import React, { useState } from "react";
import { Alert } from "react-native";
import { IconButton, Menu } from "react-native-paper";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useTripStore } from "@/features/trips";
import type { RootStackParamList } from "@/navigation";
import { useAppTheme } from "@/theme";

export type TripOptionsMenuProps = {
  tripId: string;
  navigation: NativeStackNavigationProp<RootStackParamList, "Trip">;
};

/** Native-header "..." menu for Trip Detail — Delete Trip only (its drives are unbundled, never deleted). */
export function TripOptionsMenu({ tripId, navigation }: TripOptionsMenuProps) {
  const theme = useAppTheme();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const deleteTrip = useTripStore((state) => state.deleteTrip);

  const handleDelete = () => {
    setIsMenuVisible(false);
    Alert.alert(
      "Delete this trip?",
      "This removes the trip and its comments. Its drives aren't deleted — they'll just no longer be bundled together.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTrip(tripId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <Menu
      visible={isMenuVisible}
      onDismiss={() => setIsMenuVisible(false)}
      anchor={
        <IconButton
          icon="dots-vertical"
          iconColor={theme.palette.textPrimary}
          onPress={() => setIsMenuVisible(true)}
        />
      }
    >
      <Menu.Item onPress={handleDelete} title="Delete Trip" leadingIcon="delete-outline" />
    </Menu>
  );
}
