import React, { useState } from "react";
import { Alert } from "react-native";
import { IconButton, Menu } from "react-native-paper";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useDriveStore } from "@/features/drives";
import { AddToTripModal } from "@/features/trips";
import type { RootStackParamList } from "@/navigation";
import { useAppTheme } from "@/theme";

export type DriveOptionsMenuProps = {
  driveId: string;
  navigation: NativeStackNavigationProp<RootStackParamList, "Drive">;
};

/** Native-header "..." menu for Drive Detail — Delete Drive plus Trip membership. */
export function DriveOptionsMenu({ driveId, navigation }: DriveOptionsMenuProps) {
  const theme = useAppTheme();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isAddToTripVisible, setIsAddToTripVisible] = useState(false);
  const deleteDrive = useDriveStore((state) => state.deleteDrive);
  const removeDriveFromTrip = useDriveStore((state) => state.removeDriveFromTrip);
  const tripId = useDriveStore(
    (state) => state.pastDrives.find((drive) => drive.id === driveId)?.tripId ?? null
  );

  const handleDelete = () => {
    setIsMenuVisible(false);
    Alert.alert(
      "Delete this drive?",
      "This permanently removes the drive, its route, photos, and notes.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteDrive(driveId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleAddToTrip = () => {
    setIsMenuVisible(false);
    if (tripId) {
      Alert.alert("Already part of a trip", "This drive is already part of a trip — remove it first to add it elsewhere.");
      return;
    }
    setIsAddToTripVisible(true);
  };

  const handleRemoveFromTrip = () => {
    setIsMenuVisible(false);
    if (!tripId) {
      Alert.alert("Not part of a trip", "This drive isn't part of a trip yet.");
      return;
    }
    Alert.alert("Remove from trip?", "This drive will no longer be bundled with that trip.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeDriveFromTrip(driveId) },
    ]);
  };

  return (
    <>
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
        <Menu.Item onPress={handleAddToTrip} title="Add to Trip" leadingIcon="bag-suitcase-outline" />
        <Menu.Item onPress={handleRemoveFromTrip} title="Remove from Trip" leadingIcon="bag-suitcase" />
        <Menu.Item onPress={handleDelete} title="Delete Drive" leadingIcon="delete-outline" />
      </Menu>

      <AddToTripModal visible={isAddToTripVisible} driveId={driveId} onClose={() => setIsAddToTripVisible(false)} />
    </>
  );
}
