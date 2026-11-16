import React, { useState } from "react";
import { Alert } from "react-native";
import { Divider, IconButton, Menu } from "react-native-paper";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { EditDriveDialog, shareDriveAsGpx, useDriveStore } from "@/features/drives";
import { AddToTripModal } from "@/features/trips";
import type { RootStackParamList } from "@/navigation";
import { useAppTheme } from "@/theme";

export type DriveOptionsMenuProps = {
  driveId: string;
  navigation: NativeStackNavigationProp<RootStackParamList, "Drive">;
};

/** Native-header "..." menu for Drive Detail — edit, share the route as GPX, Trip membership, and delete. */
export function DriveOptionsMenu({ driveId, navigation }: DriveOptionsMenuProps) {
  const theme = useAppTheme();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isAddToTripVisible, setIsAddToTripVisible] = useState(false);
  const [isEditVisible, setIsEditVisible] = useState(false);
  const deleteDrive = useDriveStore((state) => state.deleteDrive);
  const removeDriveFromTrip = useDriveStore((state) => state.removeDriveFromTrip);
  const tripId = useDriveStore(
    (state) => state.pastDrives.find((drive) => drive.id === driveId)?.tripId ?? null
  );

  const handleEdit = () => {
    setIsMenuVisible(false);
    setIsEditVisible(true);
  };

  const handleShareGpx = async () => {
    setIsMenuVisible(false);
    const drive = useDriveStore.getState().pastDrives.find((candidate) => candidate.id === driveId);
    if (!drive) return;
    try {
      await shareDriveAsGpx(drive);
    } catch (error) {
      Alert.alert("Couldn't share route", error instanceof Error ? error.message : "Something went wrong.");
    }
  };

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
    setIsAddToTripVisible(true);
  };

  const handleRemoveFromTrip = () => {
    setIsMenuVisible(false);
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
        <Menu.Item onPress={handleEdit} title="Edit name & review" leadingIcon="pencil-outline" />
        <Menu.Item onPress={handleShareGpx} title="Share route (GPX)" leadingIcon="export-variant" />
        {/* Only the action that applies — a drive belongs to at most one trip. */}
        {tripId ? (
          <Menu.Item onPress={handleRemoveFromTrip} title="Remove from Trip" leadingIcon="bag-suitcase-off-outline" />
        ) : (
          <Menu.Item onPress={handleAddToTrip} title="Add to Trip" leadingIcon="bag-suitcase-outline" />
        )}
        <Divider />
        <Menu.Item
          onPress={handleDelete}
          title="Delete Drive"
          leadingIcon="delete-outline"
          titleStyle={{ color: theme.palette.error }}
        />
      </Menu>

      <AddToTripModal visible={isAddToTripVisible} driveId={driveId} onClose={() => setIsAddToTripVisible(false)} />
      <EditDriveDialog visible={isEditVisible} driveId={driveId} onClose={() => setIsEditVisible(false)} />
    </>
  );
}
