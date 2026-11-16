import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import MapLibreGL, {
  Camera,
  LineLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
  type CameraRef,
} from "@maplibre/maplibre-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppButton, AppDialog, AppText } from "@/components";
import { spacing, useAppTheme } from "@/theme";
import { formatStartedAt } from "@/utils";

import { getPinThumbnailUri } from "../pinMedia";
import type { Coordinates, Note, Pin } from "../types";

MapLibreGL.setAccessToken(null);
// Tile requests routinely get cancelled when the camera re-centers or the
// style is still loading — that's expected, not an error, so drop it below
// "error" level instead of spamming the log on every recenter.
MapLibreGL.Logger.setLogLevel("error");

// OpenFreeMap: a donation-funded, no-API-key, no-rate-limit OSM vector
// style host. "liberty" is its full-color default; "dark" is the matching
// night style, used when the app itself is in dark mode. ("positron",
// "bright", and "fiord" are the other free styles at the same host.)
export const LIGHT_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
export const DARK_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

const LIVE_ZOOM_LEVEL = 14;
const CAMERA_ANIMATION_MS = 800;
const FIT_PADDING = 48;
/** Below this lat/lng span a "route" is effectively a single spot — center on it rather than fitting zero-size bounds. */
const MIN_BOUNDS_SPAN_DEGREES = 0.0001;

const NO_NOTES: Note[] = [];

export type NamedRoute = {
  id: string;
  coordinates: Coordinates[];
};

// Cycled per-route when `routes` is used, so drives in a Trip's combined map are visually distinguishable.
export const ROUTE_COLOR_PALETTE = ["#2E7DFB", "#F5A623", "#7ED957", "#D64545", "#9B59B6", "#1ABC9C"];

export type RouteMapHandle = {
  /** Snaps the camera back to the live location (or the whole route) and resumes following. */
  recenter: () => void;
};

export type RouteMapProps = {
  currentLocation: Coordinates | null;
  pins: Pin[];
  notes?: Note[];
  /** A single active/past drive's recorded path, drawn as a line if it has 2+ points. */
  routeCoordinates?: Coordinates[];
  /** Multiple drives' paths (e.g. every drive in a Trip), each drawn in its own color. Takes precedence over `routeCoordinates`. */
  routes?: NamedRoute[];
  /** Makes photo/video markers tappable — e.g. to open the full-screen viewer on that pin. */
  onPinPress?: (pin: Pin) => void;
  /**
   * Space (in points) covered by the host screen's own floating UI, so the
   * camera centers on the part of the map that's actually visible and the
   * attribution button isn't hidden underneath a panel.
   */
  overlayInsets?: { top?: number; bottom?: number };
  /** Set false when the host screen renders its own recenter control (via the `recenter()` handle). */
  showRecenterControl?: boolean;
  /** Fires when the user pans away (false) or the camera resumes following (true). */
  onFollowingChange?: (isFollowing: boolean) => void;
};

export function toLineFeature(coordinates: Coordinates[]): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: coordinates.map((point) => [point.longitude, point.latitude]),
    },
    properties: {},
  };
}

/**
 * The app's one map. With a `currentLocation` it's a live map that follows
 * the user; without one it frames the whole recorded route (plus any
 * pins/notes). Either way, the moment the user pans or zooms by hand the
 * camera stops auto-moving, and a recenter control brings it back.
 */
export const RouteMap = forwardRef<RouteMapHandle, RouteMapProps>(function RouteMap(
  {
    currentLocation,
    pins,
    notes = NO_NOTES,
    routeCoordinates,
    routes,
    onPinPress,
    overlayInsets,
    showRecenterControl = true,
    onFollowingChange,
  },
  ref
) {
  const theme = useAppTheme();
  const cameraRef = useRef<CameraRef>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  // Camera commands issued before the native map has finished loading are
  // silently dropped, so wait for `onDidFinishLoadingMap` before the first
  // fit — otherwise a past route that never changes again (no re-render to
  // retry on) can get stuck on the default [0, 0] camera, which renders as
  // a plain blue ocean tile with no route visible.
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  // The first frame (and every explicit recenter) also sets the zoom; later
  // follow-updates only move the center, so a zoom level the user picked sticks.
  const shouldResetZoomRef = useRef(true);

  const insetTop = overlayInsets?.top ?? 0;
  const insetBottom = overlayInsets?.bottom ?? 0;
  // Read through a ref so a panel resizing doesn't by itself re-trigger a camera move.
  const insetsRef = useRef({ top: insetTop, bottom: insetBottom });
  insetsRef.current = { top: insetTop, bottom: insetBottom };

  // Pins with no known position (media added later, with no GPS metadata) simply have no marker.
  const locatedPins = useMemo(
    () => pins.filter((pin): pin is Pin & { coordinates: Coordinates } => pin.coordinates !== null),
    [pins]
  );

  // Everything worth keeping in frame when there's no live location to follow.
  const focusCoordinates = useMemo<Coordinates[]>(() => {
    const routePoints = routes ? routes.flatMap((route) => route.coordinates) : routeCoordinates ?? [];
    return [
      ...routePoints,
      ...locatedPins.map((pin) => pin.coordinates),
      ...notes.map((note) => note.coordinates),
    ];
  }, [routes, routeCoordinates, locatedPins, notes]);

  const frameCamera = useCallback(
    (resetZoom: boolean) => {
      const camera = cameraRef.current;
      if (!camera) return;
      const { top, bottom } = insetsRef.current;

      if (currentLocation) {
        camera.setCamera({
          centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
          ...(resetZoom ? { zoomLevel: LIVE_ZOOM_LEVEL } : null),
          padding: { paddingTop: top, paddingBottom: bottom },
          animationDuration: CAMERA_ANIMATION_MS,
        });
        return;
      }

      const first = focusCoordinates[0];
      if (!first) return;

      // A plain loop rather than Math.max(...array): a long drive has enough points to overflow the call stack when spread.
      let minLat = first.latitude;
      let maxLat = first.latitude;
      let minLng = first.longitude;
      let maxLng = first.longitude;
      for (const point of focusCoordinates) {
        if (point.latitude < minLat) minLat = point.latitude;
        if (point.latitude > maxLat) maxLat = point.latitude;
        if (point.longitude < minLng) minLng = point.longitude;
        if (point.longitude > maxLng) maxLng = point.longitude;
      }

      if (maxLat - minLat < MIN_BOUNDS_SPAN_DEGREES && maxLng - minLng < MIN_BOUNDS_SPAN_DEGREES) {
        camera.setCamera({
          centerCoordinate: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
          zoomLevel: LIVE_ZOOM_LEVEL,
          animationDuration: CAMERA_ANIMATION_MS,
        });
        return;
      }

      camera.fitBounds(
        [maxLng, maxLat],
        [minLng, minLat],
        [FIT_PADDING + top, FIT_PADDING, FIT_PADDING + bottom, FIT_PADDING],
        CAMERA_ANIMATION_MS
      );
    },
    [currentLocation, focusCoordinates]
  );

  useEffect(() => {
    if (!isMapReady || !isFollowing) return;
    frameCamera(shouldResetZoomRef.current);
    // Only "spend" the zoom reset once there was actually something to frame.
    if (currentLocation || focusCoordinates.length > 0) shouldResetZoomRef.current = false;
  }, [isMapReady, isFollowing, frameCamera, currentLocation, focusCoordinates]);

  const recenter = useCallback(() => {
    if (isFollowing) {
      frameCamera(true);
      return;
    }
    // Flipping back to following re-runs the effect above, which does the (zoom-resetting) frame.
    shouldResetZoomRef.current = true;
    setIsFollowing(true);
  }, [isFollowing, frameCamera]);

  useImperativeHandle(ref, () => ({ recenter }), [recenter]);

  useEffect(() => {
    onFollowingChange?.(isFollowing);
    // Deliberately keyed on the value only — an inline callback prop shouldn't re-fire this every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFollowing]);

  const singleRoute = !routes && routeCoordinates && routeCoordinates.length > 1 ? routeCoordinates : null;
  const routeStart = singleRoute?.[0];
  // The end marker only makes sense for a finished route — on the live map the "end" is the current-location dot.
  const routeEnd = singleRoute && !currentLocation ? singleRoute[singleRoute.length - 1] : undefined;

  const hasSomethingToFrame = currentLocation !== null || focusCoordinates.length > 0;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapStyle={theme.dark ? DARK_MAP_STYLE_URL : LIGHT_MAP_STYLE_URL}
        attributionPosition={{ bottom: insetBottom + spacing.sm, left: spacing.sm }}
        onDidFinishLoadingMap={() => setIsMapReady(true)}
        onRegionWillChange={(feature) => {
          if (feature.properties.isUserInteraction) setIsFollowing(false);
        }}
      >
        <Camera ref={cameraRef} defaultSettings={{ zoomLevel: 12 }} />

        {routes
          ? routes
              .filter((route) => route.coordinates.length > 1)
              .map((route, index) => (
                <ShapeSource key={route.id} id={`route-source-${route.id}`} shape={toLineFeature(route.coordinates)}>
                  <LineLayer id={`route-casing-${route.id}`} style={ROUTE_CASING_STYLE} />
                  <LineLayer
                    id={`route-line-${route.id}`}
                    style={{
                      ...ROUTE_LINE_STYLE,
                      lineColor: ROUTE_COLOR_PALETTE[index % ROUTE_COLOR_PALETTE.length],
                    }}
                  />
                </ShapeSource>
              ))
          : singleRoute ? (
            <ShapeSource id="route-source" shape={toLineFeature(singleRoute)}>
              <LineLayer id="route-casing" style={ROUTE_CASING_STYLE} />
              <LineLayer id="route-line" style={{ ...ROUTE_LINE_STYLE, lineColor: theme.palette.primary }} />
            </ShapeSource>
          ) : null}

        {routeStart ? (
          <PointAnnotation id="route-start" coordinate={[routeStart.longitude, routeStart.latitude]}>
            <View style={[styles.endpoint, { backgroundColor: "#FFFFFF", borderColor: theme.palette.success }]} />
          </PointAnnotation>
        ) : null}

        {routeEnd ? (
          <PointAnnotation id="route-end" coordinate={[routeEnd.longitude, routeEnd.latitude]}>
            <View style={[styles.endpoint, { backgroundColor: theme.palette.primary, borderColor: "#FFFFFF" }]} />
          </PointAnnotation>
        ) : null}

        {currentLocation ? (
          <PointAnnotation
            id="current-location"
            coordinate={[currentLocation.longitude, currentLocation.latitude]}
          >
            <View style={[styles.currentLocationHalo, { backgroundColor: `${theme.palette.primary}33` }]}>
              <View
                style={[
                  styles.currentLocationDot,
                  { backgroundColor: theme.palette.primary, borderColor: "#FFFFFF" },
                ]}
              />
            </View>
          </PointAnnotation>
        ) : null}

        {locatedPins.map((pin) => (
          <PointAnnotation
            key={pin.id}
            id={pin.id}
            coordinate={[pin.coordinates.longitude, pin.coordinates.latitude]}
            onSelected={onPinPress ? () => onPinPress(pin) : undefined}
          >
            <View style={styles.pin}>
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
            <View style={[styles.notePin, { backgroundColor: theme.palette.success }]}>
              <MaterialCommunityIcons name="comment-text-outline" size={16} color="#FFFFFF" />
            </View>
          </PointAnnotation>
        ))}
      </MapView>

      {showRecenterControl && !isFollowing && hasSomethingToFrame ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={currentLocation ? "Recenter on my location" : "Show the whole route"}
          onPress={recenter}
          hitSlop={8}
          style={[
            styles.recenterButton,
            theme.shadows.md,
            { top: insetTop + spacing.sm, backgroundColor: theme.palette.surface },
          ]}
        >
          <MaterialCommunityIcons
            name={currentLocation ? "crosshairs-gps" : "fit-to-screen-outline"}
            size={20}
            color={theme.palette.primary}
          />
        </Pressable>
      ) : null}

      <AppDialog visible={!!selectedNote} onClose={() => setSelectedNote(null)}>
        <AppText color="secondary" variant="labelSmall" style={styles.noteTimestamp}>
          {selectedNote ? formatStartedAt(selectedNote.createdAt) : ""}
        </AppText>
        <AppText variant="bodyLarge" style={styles.noteText}>
          {selectedNote?.text}
        </AppText>
        <AppButton label="Close" variant="text" onPress={() => setSelectedNote(null)} />
      </AppDialog>
    </View>
  );
});

// A wider white line under the colored one, so the route stays legible over any map color.
export const ROUTE_CASING_STYLE = {
  lineColor: "#FFFFFF",
  lineWidth: 7,
  lineOpacity: 0.9,
  lineCap: "round",
  lineJoin: "round",
} as const;

export const ROUTE_LINE_STYLE = {
  lineWidth: 4,
  lineCap: "round",
  lineJoin: "round",
} as const;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  currentLocationHalo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  currentLocationDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
  },
  endpoint: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 4,
  },
  pin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#FFFFFF",
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
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  recenterButton: {
    position: "absolute",
    right: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noteTimestamp: {
    marginBottom: spacing.xs,
  },
  noteText: {
    marginBottom: spacing.md,
  },
});
