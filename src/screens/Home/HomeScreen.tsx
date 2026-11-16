import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { v4 as uuid } from "uuid";

import { AppHeader, Card, LoadingIndicator, ScreenContainer } from "@/components";
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
  type Note,
  type Pin,
  type RouteMapHandle,
} from "@/features/map";
import { spacing, useAppTheme } from "@/theme";

// Stable empties, so the map isn't handed a brand-new array every render while no drive is active.
const NO_PINS: Pin[] = [];
const NO_NOTES: Note[] = [];

/** Approximate height of the floating search bar, used to keep the map's focus point clear of it. */
const SEARCH_BAR_HEIGHT = 56;

/**
 * A full-bleed live map with everything else floating over it: search on
 * top, and a bottom panel that's lifetime stats + Start Drive when idle,
 * or live recording stats + Stop Drive while a drive is in progress.
 */
export function HomeScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const locationPermission = useLocationPermission();
  const { coordinates, speedMps, timestamp } = useCurrentLocation(locationPermission.isGranted);

  const mapRef = useRef<RouteMapHandle>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [panelHeight, setPanelHeight] = useState(0);

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
        <AppHeader title="Mile Marker" />
        <PermissionGate
          title="Location access needed"
          message="Mile Marker uses your location to center the map and place photo pins where you are."
          actionLabel="Enable location"
          onRequestAccess={locationPermission.request}
        />
      </ScreenContainer>
    );
  }

  const topInset = insets.top + spacing.sm;

  return (
    <View style={[styles.root, { backgroundColor: theme.palette.background }]}>
      <RouteMap
        ref={mapRef}
        currentLocation={coordinates}
        pins={activeDrive?.pins ?? NO_PINS}
        notes={activeDrive?.notes ?? NO_NOTES}
        routeCoordinates={activeDrive?.points}
        overlayInsets={{ top: topInset + SEARCH_BAR_HEIGHT, bottom: panelHeight + spacing.md }}
        showRecenterControl={false}
        onFollowingChange={setIsFollowing}
      />

      {/* `box-none` wrappers: the floating controls take touches, the gaps between them fall through to the map. */}
      <View pointerEvents="box-none" style={[styles.overlay, { paddingTop: topInset }]}>
        <DriveSearchBar />

        <View pointerEvents="box-none">
          <View pointerEvents="box-none" style={styles.mapControls}>
            {!isFollowing && coordinates ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Recenter on my location"
                onPress={() => mapRef.current?.recenter()}
                style={[styles.recenterButton, theme.shadows.md, { backgroundColor: theme.palette.surface }]}
              >
                <MaterialCommunityIcons name="crosshairs-gps" size={22} color={theme.palette.primary} />
              </Pressable>
            ) : null}

            {activeDrive ? (
              <>
                <AddNoteButton
                  style={styles.fab}
                  disabled={!coordinates}
                  onSubmitNote={(text) => {
                    if (!coordinates) return;
                    addNoteToActiveDrive({ id: uuid(), text, coordinates, createdAt: Date.now() });
                  }}
                />
                <AddPinButton
                  style={styles.fab}
                  disabled={!coordinates}
                  // While recording, a photo with no GPS metadata of its own is pinned where you are right now.
                  onPickMedia={async (uri, mediaType, mediaLocation) => {
                    if (!coordinates) return;
                    const id = uuid();
                    const { uri: persistedUri, thumbnailUri } = await persistPinMedia(uri, id, mediaType);
                    addPinToActiveDrive({
                      id,
                      uri: persistedUri,
                      mediaType,
                      thumbnailUri,
                      coordinates: mediaLocation ?? coordinates,
                      createdAt: Date.now(),
                    });
                  }}
                />
              </>
            ) : null}
          </View>

          <View onLayout={(event) => setPanelHeight(event.nativeEvent.layout.height)}>
            <Card elevation="lg" style={styles.panel}>
              {activeDrive ? <DriveRecordingStats drive={activeDrive} /> : <LifetimeStats />}
              <DriveControls />
            </Card>
          </View>
        </View>
      </View>

      <SaveDriveDialog />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  mapControls: {
    alignItems: "flex-end",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  recenterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    // Lines the smaller round button up with the 56pt FABs stacked beneath it.
    marginRight: spacing.xs,
  },
  // The FABs default to absolute placement over a boxed map — here they sit in the normal flow of the controls column.
  fab: {
    position: "relative",
    right: 0,
    bottom: 0,
  },
  panel: {
    gap: spacing.md,
  },
});
