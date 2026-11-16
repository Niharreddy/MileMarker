import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import {
  Camera,
  CircleLayer,
  LineLayer,
  MapView,
  ShapeSource,
  type CameraRef,
  type MapViewRef,
} from "@maplibre/maplibre-react-native";

import { useAppTheme } from "@/theme";

import type { Coordinates } from "../types";
import {
  DARK_MAP_STYLE_URL,
  LIGHT_MAP_STYLE_URL,
  ROUTE_CASING_STYLE,
  ROUTE_COLOR_PALETTE,
  ROUTE_LINE_STYLE,
  toLineFeature,
  type NamedRoute,
} from "./RouteMap";

const FIT_PADDING = 36;

export type SnapshotRouteMapHandle = {
  /** Renders the map exactly as currently framed to a PNG file and resolves with its `file://` URI. */
  takeSnapshot: () => Promise<string>;
};

export type SnapshotRouteMapProps = {
  routes: NamedRoute[];
};

/**
 * A map built to be photographed: routes and their start/end dots are all
 * drawn as native map layers (no React-view markers, which a map snapshot
 * can't see), so `takeSnapshot()` captures everything on screen. The user
 * can still pan/zoom first to frame the shot.
 */
export const SnapshotRouteMap = forwardRef<SnapshotRouteMapHandle, SnapshotRouteMapProps>(function SnapshotRouteMap(
  { routes },
  ref
) {
  const theme = useAppTheme();
  const mapRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const drawableRoutes = useMemo(() => routes.filter((route) => route.coordinates.length > 1), [routes]);

  const endpoints = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(() => {
    const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
    const first = drawableRoutes[0]?.coordinates[0];
    const lastRoute = drawableRoutes[drawableRoutes.length - 1];
    const last = lastRoute?.coordinates[lastRoute.coordinates.length - 1];
    if (first) {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [first.longitude, first.latitude] },
        properties: { kind: "start" },
      });
    }
    if (last) {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [last.longitude, last.latitude] },
        properties: { kind: "end" },
      });
    }
    return { type: "FeatureCollection", features };
  }, [drawableRoutes]);

  useEffect(() => {
    if (!isMapReady) return;
    const points: Coordinates[] = drawableRoutes.flatMap((route) => route.coordinates);
    const first = points[0];
    if (!first) return;

    let minLat = first.latitude;
    let maxLat = first.latitude;
    let minLng = first.longitude;
    let maxLng = first.longitude;
    for (const point of points) {
      if (point.latitude < minLat) minLat = point.latitude;
      if (point.latitude > maxLat) maxLat = point.latitude;
      if (point.longitude < minLng) minLng = point.longitude;
      if (point.longitude > maxLng) maxLng = point.longitude;
    }
    cameraRef.current?.fitBounds([maxLng, maxLat], [minLng, minLat], FIT_PADDING, 0);
  }, [isMapReady, drawableRoutes]);

  useImperativeHandle(
    ref,
    () => ({
      takeSnapshot: async () => {
        if (!mapRef.current) throw new Error("The map isn't ready yet.");
        return mapRef.current.takeSnap(true);
      },
    }),
    []
  );

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      mapStyle={theme.dark ? DARK_MAP_STYLE_URL : LIGHT_MAP_STYLE_URL}
      compassEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      onDidFinishLoadingMap={() => setIsMapReady(true)}
    >
      <Camera ref={cameraRef} defaultSettings={{ zoomLevel: 10 }} />

      {drawableRoutes.map((route, index) => (
        <ShapeSource key={route.id} id={`snapshot-route-${route.id}`} shape={toLineFeature(route.coordinates)}>
          <LineLayer id={`snapshot-casing-${route.id}`} style={ROUTE_CASING_STYLE} />
          <LineLayer
            id={`snapshot-line-${route.id}`}
            style={{
              ...ROUTE_LINE_STYLE,
              // One route wears the brand color; several get told apart the same way Trip Detail does.
              lineColor:
                drawableRoutes.length === 1
                  ? theme.palette.primary
                  : ROUTE_COLOR_PALETTE[index % ROUTE_COLOR_PALETTE.length],
            }}
          />
        </ShapeSource>
      ))}

      <ShapeSource id="snapshot-endpoints" shape={endpoints}>
        <CircleLayer
          id="snapshot-endpoint-dots"
          style={{
            circleRadius: 6,
            circleStrokeWidth: 3,
            circleColor: ["match", ["get", "kind"], "start", "#FFFFFF", theme.palette.primary],
            circleStrokeColor: ["match", ["get", "kind"], "start", theme.palette.success, "#FFFFFF"],
          }}
        />
      </ShapeSource>
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: { flex: 1 },
});
