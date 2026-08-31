import React from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppHeader, AppText, ScreenContainer } from "@/components";
import { useDriveStore, type Drive } from "@/features/drives";
import { useSettingsStore } from "@/store";
import { spacing, useAppTheme } from "@/theme";
import { calculateRouteDistanceMeters, formatDistance, formatDuration, formatStartedAt } from "@/utils";

function DriveRow({ drive, onPress }: { drive: Drive; onPress: () => void }) {
  const theme = useAppTheme();
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const distance = formatDistance(calculateRouteDistanceMeters(drive.points), unitPreference);

  return (
    <Pressable onPress={onPress} style={[styles.row, { borderBottomColor: theme.palette.border }]}>
      <AppText variant="titleSmall">{drive.name}</AppText>
      <AppText color="secondary">
        {formatStartedAt(drive.startedAt)} · {formatDuration(drive.startedAt, drive.endedAt)} ·{" "}
        {distance} · {drive.pins.length} {drive.pins.length === 1 ? "photo" : "photos"}
      </AppText>
    </Pressable>
  );
}

/** List of completed drives. Recording happens on the Home tab; this only reads the result. */
export function DrivesScreen() {
  const navigation = useNavigation();
  const pastDrives = useDriveStore((state) => state.pastDrives);

  return (
    <ScreenContainer>
      <AppHeader title="Drives" />
      <FlatList
        data={pastDrives}
        keyExtractor={(drive) => drive.id}
        ListEmptyComponent={
          <AppText color="secondary">No drives recorded yet — start one from the Home tab.</AppText>
        }
        renderItem={({ item }) => (
          <DriveRow drive={item} onPress={() => navigation.navigate("Drive", { driveId: item.id })} />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xxs,
  },
});
