import React, { useEffect, useRef } from "react";
import { Image, StyleSheet, View } from "react-native";
import MapLibreGL, {
  Camera,
  LineLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
  type CameraRef,
} from "@maplibre/maplibre-react-native";

import { useAppTheme } from "@/theme";

import type { Coordinates, Pin } from "../types";

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
  /** The active trip's recorded path, drawn as a line if it has 2+ points. */
  routeCoordinates?: Coordinates[];
};

export function RouteMap({ currentLocation, pins, routeCoordinates }: RouteMapProps) {
  const theme = useAppTheme();
  const cameraRef = useRef<CameraRef>(null);

  useEffect(() => {
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
  }, [currentLocation, routeCoordinates]);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} mapStyle={MAP_STYLE_URL}>
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
              <Image source={{ uri: pin.uri }} style={styles.pinImage} />
            </View>
          </PointAnnotation>
        ))}
      </MapView>
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
});
