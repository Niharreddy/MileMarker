import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PermissionStatus } from "expo-modules-core";

import { AppButton, AppText, LoadingIndicator, ScreenContainer } from "@/components";
import { useBackgroundLocationPermission, useGalleryPermission, useLocationPermission } from "@/features/map";
import { spacing, useAppTheme } from "@/theme";

export type PermissionsPrimingScreenProps = {
  onDone: () => void;
};

/**
 * Shown once per launch, right after the welcome screen, requesting
 * location + background location + gallery access up front instead of
 * lazily the first time each feature needs them. Auto-skips (calls
 * `onDone` without rendering the ask-for-permissions UI) once every
 * permission already has a real answer from a previous launch — re-asking
 * something the OS already resolved would just be noise.
 */
export function PermissionsPrimingScreen({ onDone }: PermissionsPrimingScreenProps) {
  const theme = useAppTheme();
  const locationPermission = useLocationPermission();
  const backgroundPermission = useBackgroundLocationPermission();
  const galleryPermission = useGalleryPermission();
  const [isRequesting, setIsRequesting] = useState(false);

  const isChecking =
    locationPermission.isChecking || backgroundPermission.isChecking || galleryPermission.isChecking;

  const allDetermined =
    locationPermission.status !== PermissionStatus.UNDETERMINED &&
    backgroundPermission.status !== PermissionStatus.UNDETERMINED &&
    galleryPermission.status !== PermissionStatus.UNDETERMINED;

  useEffect(() => {
    if (!isChecking && allDetermined) {
      onDone();
    }
  }, [isChecking, allDetermined, onDone]);

  if (isChecking || allDetermined) {
    return (
      <ScreenContainer>
        <LoadingIndicator fullscreen />
      </ScreenContainer>
    );
  }

  const handleContinue = async () => {
    setIsRequesting(true);
    // Background permission can only be requested once foreground is granted.
    const foregroundGranted = await locationPermission.request();
    if (foregroundGranted) {
      await backgroundPermission.request();
    }
    await galleryPermission.request();
    setIsRequesting(false);
    onDone();
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <MaterialCommunityIcons name="shield-check-outline" size={48} color={theme.palette.primary} />
        <AppText variant="headlineMedium" style={styles.title}>
          Before we start
        </AppText>
        <AppText color="secondary" style={styles.subtitle}>
          Mile Marker needs a few permissions to record your trips and attach photos automatically.
        </AppText>

        <PermissionRow
          icon="map-marker-outline"
          title="Location"
          description="To draw your route on the map."
        />
        <PermissionRow
          icon="map-marker-radius-outline"
          title="Background location"
          description="So recording keeps going when the app isn't open."
        />
        <PermissionRow
          icon="image-multiple-outline"
          title="Photos"
          description="To find photos taken along your route and attach them automatically."
        />
      </View>

      <AppButton label="Continue" onPress={handleContinue} loading={isRequesting} style={styles.button} />
    </ScreenContainer>
  );
}

type PermissionRowProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
};

function PermissionRow({ icon, title, description }: PermissionRowProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name={icon} size={24} color={theme.palette.primary} style={styles.rowIcon} />
      <View style={styles.rowText}>
        <AppText variant="titleSmall">{title}</AppText>
        <AppText color="secondary" variant="bodySmall">
          {description}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  rowIcon: {
    marginRight: spacing.sm,
    marginTop: spacing.xxs,
  },
  rowText: {
    flex: 1,
  },
  button: {
    marginBottom: spacing.md,
  },
});
