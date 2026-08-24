import React, { useEffect, useRef, useState } from "react";
import { Image, Modal, StyleSheet, View } from "react-native";
import MapLibreGL, {
  Camera,
  LineLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
  type CameraRef,
} from "@maplibre/maplibre-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppButton, AppText } from "@/components";
import { spacing, useAppTheme } from "@/theme";

import { getPinThumbnailUri } from "../pinMedia";
import type { Coordinates, Note, Pin } from "../types";

function formatNoteTimestamp(createdAt: number) {
  return new Date(createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

MapLibreGL.setAccessToken(null);
// Tile requests routinely get cancelled when the camera re-centers or the
// style is still loading — that's expected, not an error, so drop it below
// "error" level instead of spamming the log on every recenter.
MapLibreGL.Logger.setLogLevel("error");

// OpenFreeMap: a donation-funded, no-API-key, no-rate-limit OSM vector
// style — includes roads, buildings, parks, and labels. "liberty" is its
// full-color default; "positron" (light, minimal) and "bright" (higher
// contrast) are the other free styles at the same tiles.openfreemap.org
// host if a different look is wanted later.
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export type RouteMapProps = {
  currentLocation: Coordinates | null;
  pins: Pin[];
  notes?: Note[];
  /** The active trip's recorded path, drawn as a line if it has 2+ points. */
  routeCoordinates?: Coordinates[];
};

export function RouteMap({ currentLocation, pins, notes = [], routeCoordinates }: RouteMapProps) {
  const theme = useAppTheme();
  const cameraRef = useRef<CameraRef>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  // Camera commands issued before the native map has finished loading are
  // silently dropped, so wait for `onDidFinishLoadingMap` before the first
  // fit — otherwise a past trip with a route that never changes again (no
  // re-render to retry on) can get stuck on the default [0, 0] camera,
  // which renders as a plain blue ocean tile with no route visible.
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!isMapReady) return;

    if (currentLocation) {
      cameraRef.current?.setCamera({
        centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
        zoomLevel: 14,
        animationDuration: 800,
      });
      return;
    }

    // No live location (e.g. viewing a past trip) — frame the whole route instead.
    if (routeCoordinates && routeCoordinates.length > 1) {
      const latitudes = routeCoordinates.map((point) => point.latitude);
      const longitudes = routeCoordinates.map((point) => point.longitude);
      const northEast: [number, number] = [Math.max(...longitudes), Math.max(...latitudes)];
      const southWest: [number, number] = [Math.min(...longitudes), Math.min(...latitudes)];
      cameraRef.current?.fitBounds(northEast, southWest, 48, 800);
    }
  }, [currentLocation, routeCoordinates, isMapReady]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapStyle={MAP_STYLE_URL}
        onDidFinishLoadingMap={() => setIsMapReady(true)}
      >
        <Camera ref={cameraRef} defaultSettings={{ zoomLevel: 12 }} />

        {routeCoordinates && routeCoordinates.length > 1 ? (
          <ShapeSource
            id="route-source"
            shape={{
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: routeCoordinates.map((point) => [point.longitude, point.latitude]),
              },
              properties: {},
            }}
          >
            <LineLayer
              id="route-line"
              style={{ lineColor: theme.palette.primary, lineWidth: 4, lineCap: "round", lineJoin: "round" }}
            />
          </ShapeSource>
        ) : null}

        {currentLocation ? (
          <PointAnnotation
            id="current-location"
            coordinate={[currentLocation.longitude, currentLocation.latitude]}
          >
            <View
              style={[
                styles.currentLocationDot,
                { backgroundColor: theme.palette.primary, borderColor: theme.palette.onPrimary },
              ]}
            />
          </PointAnnotation>
        ) : null}

        {pins.map((pin) => (
          <PointAnnotation
            key={pin.id}
            id={pin.id}
            coordinate={[pin.coordinates.longitude, pin.coordinates.latitude]}
          >
            <View style={[styles.pin, { borderColor: theme.palette.onPrimary }]}>
              <Image source={{ uri: getPinThumbnailUri(pin) }} style={styles.pinImage} />
              {pin.mediaType === "video" ? (
                <View style={styles.pinVideoBadge}>
                  <MaterialCommunityIcons name="play" size={14} color="#FFFFFF" />
                </View>
              ) : null}
            </View>
          </PointAnnotation>
        ))}

        {notes.map((note) => (
          <PointAnnotation
            key={note.id}
            id={note.id}
            coordinate={[note.coordinates.longitude, note.coordinates.latitude]}
            onSelected={() => setSelectedNote(note)}
          >
            <View
              style={[
                styles.notePin,
                { backgroundColor: theme.palette.success, borderColor: theme.palette.onPrimary },
              ]}
            >
              <MaterialCommunityIcons name="comment-text-outline" size={18} color={theme.palette.onPrimary} />
            </View>
          </PointAnnotation>
        ))}
      </MapView>

      <Modal visible={!!selectedNote} transparent animationType="fade" onRequestClose={() => setSelectedNote(null)}>
        <View style={styles.noteBackdrop}>
          <View style={[styles.noteCard, { backgroundColor: theme.palette.surface }]}>
            <AppText color="secondary" variant="labelSmall" style={styles.noteTimestamp}>
              {selectedNote ? formatNoteTimestamp(selectedNote.createdAt) : ""}
            </AppText>
            <AppText style={styles.noteText}>{selectedNote?.text}</AppText>
            <AppButton label="Close" variant="text" onPress={() => setSelectedNote(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  currentLocationDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    overflow: "hidden",
  },
  pinImage: {
    width: "100%",
    height: "100%",
  },
  pinVideoBadge: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  notePin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  noteBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  noteCard: {
    width: "100%",
    borderRadius: 16,
    padding: spacing.lg,
  },
  noteTimestamp: {
    marginBottom: spacing.xs,
  },
  noteText: {
    marginBottom: spacing.md,
  },
});
