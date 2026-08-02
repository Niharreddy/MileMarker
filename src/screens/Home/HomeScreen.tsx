import React from "react";
import { StyleSheet, View } from "react-native";
import { v4 as uuid } from "uuid";

import { AppHeader, LoadingIndicator, ScreenContainer } from "@/components";
import {
  AddPinButton,
  PermissionGate,
  RouteMap,
  useCurrentLocation,
  useLocationPermission,
} from "@/features/map";
import {
  LifetimeStats,
  SaveTripDialog,
  TripControls,
  TripRecordingStats,
  TripSearchBar,
  useTripRecorder,
  useTripStore,
} from "@/features/trips";
import { spacing, useAppTheme } from "@/theme";

export function HomeScreen() {
  const theme = useAppTheme();
  const locationPermission = useLocationPermission();
  const { coordinates, speedMps } = useCurrentLocation(locationPermission.isGranted);

  const activeTrip = useTripStore((state) => state.activeTrip);
  const addPinToActiveTrip = useTripStore((state) => state.addPinToActiveTrip);
  const isBackgroundTrackingActive = useTripStore((state) => state.isBackgroundTrackingActive);
  // The always-on background subscription already covers this — don't double-feed samples.
  useTripRecorder(coordinates, speedMps, !isBackgroundTrackingActive);

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
      <TripSearchBar />
      {activeTrip ? null : <LifetimeStats />}

      <View style={[styles.mapBox, { borderColor: theme.palette.border }]}>
        <RouteMap
          currentLocation={coordinates}
          pins={activeTrip?.pins ?? []}
          routeCoordinates={activeTrip?.points}
        />
        {activeTrip ? (
          <AddPinButton
            disabled={!coordinates}
            onPickPhoto={(uri) => {
              if (!coordinates) return;
              addPinToActiveTrip({ id: uuid(), uri, coordinates, createdAt: Date.now() });
            }}
          />
        ) : null}
      </View>

      {activeTrip ? <TripRecordingStats trip={activeTrip} /> : null}

      <TripControls />
      <SaveTripDialog />
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
