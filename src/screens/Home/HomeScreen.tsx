import React from "react";
import { StyleSheet, View } from "react-native";
import { v4 as uuid } from "uuid";

import { AppHeader, LoadingIndicator, ScreenContainer } from "@/components";
import {
  DriveControls,
  DriveRecordingStats,
  DriveSearchBar,
  LifetimeStats,
  persistPinMedia,
  SaveDriveDialog,
  useDriveRecorder,
  useDriveStore,
} from "@/features/drives";
import {
  AddNoteButton,
  AddPinButton,
  PermissionGate,
  RouteMap,
  useCurrentLocation,
  useLocationPermission,
} from "@/features/map";
import { spacing, useAppTheme } from "@/theme";

export function HomeScreen() {
  const theme = useAppTheme();
  const locationPermission = useLocationPermission();
  const { coordinates, speedMps, timestamp } = useCurrentLocation(locationPermission.isGranted);

  const activeDrive = useDriveStore((state) => state.activeDrive);
  const addPinToActiveDrive = useDriveStore((state) => state.addPinToActiveDrive);
  const addNoteToActiveDrive = useDriveStore((state) => state.addNoteToActiveDrive);
  const isBackgroundTrackingActive = useDriveStore((state) => state.isBackgroundTrackingActive);
  // The always-on background subscription already covers this — don't double-feed samples.
  useDriveRecorder(coordinates, speedMps, timestamp, !isBackgroundTrackingActive);

  if (locationPermission.isChecking) {
    return (
      <ScreenContainer>
        <LoadingIndicator fullscreen />
      </ScreenContainer>
    );
  }

  if (!locationPermission.isGranted) {
    return (
      <ScreenContainer>
        <AppHeader title="Home" />
        <PermissionGate
          title="Location access needed"
          message="Mile Marker uses your location to center the map and place photo pins where you are."
          actionLabel="Enable location"
          onRequestAccess={locationPermission.request}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader title="Home" />
      <DriveSearchBar />
      {activeDrive ? null : <LifetimeStats />}

      <View style={[styles.mapBox, { borderColor: theme.palette.border }]}>
        <RouteMap
          currentLocation={coordinates}
          pins={activeDrive?.pins ?? []}
          notes={activeDrive?.notes ?? []}
          routeCoordinates={activeDrive?.points}
        />
        {activeDrive ? (
          <>
            <AddPinButton
              disabled={!coordinates}
              onPickMedia={async (uri, mediaType) => {
                if (!coordinates) return;
                const id = uuid();
                const { uri: persistedUri, thumbnailUri } = await persistPinMedia(uri, id, mediaType);
                addPinToActiveDrive({
                  id,
                  uri: persistedUri,
                  mediaType,
                  thumbnailUri,
                  coordinates,
                  createdAt: Date.now(),
                });
              }}
            />
            <AddNoteButton
              disabled={!coordinates}
              onSubmitNote={(text) => {
                if (!coordinates) return;
                addNoteToActiveDrive({ id: uuid(), text, coordinates, createdAt: Date.now() });
              }}
            />
          </>
        ) : null}
      </View>

      {activeDrive ? <DriveRecordingStats drive={activeDrive} /> : null}

      <DriveControls />
      <SaveDriveDialog />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mapBox: {
    flex: 1,
    minHeight: 360,
    marginTop: spacing.sm,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
