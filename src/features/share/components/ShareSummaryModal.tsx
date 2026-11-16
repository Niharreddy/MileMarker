import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";

import { AppButton, AppHeader, AppText, ScreenContainer, SectionHeader, StatRow, type StatItem } from "@/components";
import {
  getPinThumbnailUri,
  SnapshotRouteMap,
  type NamedRoute,
  type Pin,
  type SnapshotRouteMapHandle,
} from "@/features/map";
import { radii, spacing, useAppTheme } from "@/theme";

const MAX_PHOTOS = 4;
const DEFAULT_PHOTOS = 3;
/** Give up waiting for the map snapshot image to paint after this long, and capture anyway. */
const SNAPSHOT_PAINT_TIMEOUT_MS = 1500;

export type ShareSummaryModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Date line under the title. */
  subtitle: string;
  stats: StatItem[];
  /** The route(s) to draw. With none, the card simply has no map. */
  routes: NamedRoute[];
  /** Every photo/video the user can choose from to put on the card. */
  pins: Pin[];
};

/**
 * Builds a single shareable picture of a drive or trip — map of the route,
 * headline stats, and a few photos the user picks — and hands it to the OS
 * share sheet (Instagram, Messages, save to gallery…). What's on screen in
 * the preview card is exactly what gets shared.
 */
export function ShareSummaryModal({ visible, onClose, title, subtitle, stats, routes, pins }: ShareSummaryModalProps) {
  const theme = useAppTheme();
  const cardRef = useRef<View>(null);
  const mapRef = useRef<SnapshotRouteMapHandle>(null);
  const snapshotPaintedRef = useRef<(() => void) | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [snapshotUri, setSnapshotUri] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const hasRoute = useMemo(() => routes.some((route) => route.coordinates.length > 1), [routes]);

  // Start each time with the first few photos pre-picked, so the card looks finished before the user touches anything.
  useEffect(() => {
    if (visible) setSelectedIds(pins.slice(0, DEFAULT_PHOTOS).map((pin) => pin.id));
    // Only on open — a re-render with a new `pins` array mustn't undo the user's picks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // In the order they were picked, so the user controls the arrangement on the card.
  const selectedPins = useMemo(
    () => selectedIds.map((id) => pins.find((pin) => pin.id === id)).filter((pin): pin is Pin => !!pin),
    [selectedIds, pins]
  );

  const togglePin = (pinId: string) => {
    setSelectedIds((current) => {
      if (current.includes(pinId)) return current.filter((id) => id !== pinId);
      if (current.length >= MAX_PHOTOS) return current;
      return [...current, pinId];
    });
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing isn't available on this device.");

      // A live map is a GPU surface, which a view capture can't reliably read.
      // So: ask the map itself for a still, lay that still over the live map,
      // wait for it to paint, and only then capture the whole card.
      if (hasRoute && mapRef.current) {
        try {
          const uri = await mapRef.current.takeSnapshot();
          await new Promise<void>((resolve) => {
            snapshotPaintedRef.current = resolve;
            setSnapshotUri(uri);
            setTimeout(resolve, SNAPSHOT_PAINT_TIMEOUT_MS);
          });
        } catch {
          // Fall through and capture the card as-is.
        }
      }

      const imageUri = await captureRef(cardRef, { format: "png", quality: 1, result: "tmpfile" });
      await Sharing.shareAsync(imageUri, {
        mimeType: "image/png",
        dialogTitle: `Share "${title}"`,
        UTI: "public.png",
      });
    } catch (error) {
      Alert.alert("Couldn't share", error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      snapshotPaintedRef.current = null;
      setSnapshotUri(null);
      setIsSharing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScreenContainer>
        <AppHeader
          title="Share summary"
          right={
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
              <AppText color="secondary">Close</AppText>
            </Pressable>
          }
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* `collapsable={false}` keeps this a real native view on Android, which the capture needs. */}
          <View
            ref={cardRef}
            collapsable={false}
            style={[styles.card, { backgroundColor: theme.palette.surface, borderColor: theme.palette.border }]}
          >
            {hasRoute ? (
              <View style={styles.map}>
                <SnapshotRouteMap ref={mapRef} routes={routes} />
                {snapshotUri ? (
                  <Image
                    source={{ uri: snapshotUri }}
                    style={StyleSheet.absoluteFill}
                    fadeDuration={0}
                    onLoad={() => snapshotPaintedRef.current?.()}
                  />
                ) : null}
                <View style={styles.attribution}>
                  <AppText variant="labelSmall" style={styles.attributionText}>
                    © OpenStreetMap
                  </AppText>
                </View>
              </View>
            ) : null}

            <View style={styles.cardBody}>
              <View style={styles.cardTitles}>
                <AppText variant="headlineMedium">{title}</AppText>
                <AppText color="secondary">{subtitle}</AppText>
              </View>

              <StatRow items={stats} />

              {selectedPins.length > 0 ? (
                <View style={styles.cardPhotos}>
                  {selectedPins.map((pin) => (
                    <Image
                      key={pin.id}
                      source={{ uri: getPinThumbnailUri(pin) }}
                      style={[
                        styles.cardPhoto,
                        // A lone photo gets a wide frame; several share the row as squares.
                        { aspectRatio: selectedPins.length === 1 ? 16 / 9 : 1 },
                        { backgroundColor: theme.palette.surfaceVariant },
                      ]}
                    />
                  ))}
                </View>
              ) : null}

              <View style={styles.brandRow}>
                <MaterialCommunityIcons name="compass-outline" size={16} color={theme.palette.primary} />
                <AppText variant="labelMedium" style={{ color: theme.palette.primary }}>
                  Mile Marker
                </AppText>
              </View>
            </View>
          </View>

          {hasRoute ? (
            <AppText variant="bodySmall" color="secondary" style={styles.hint}>
              Drag or pinch the map to frame it the way you want it shared.
            </AppText>
          ) : null}

          {pins.length > 0 ? (
            <>
              <SectionHeader
                title="Photos on the card"
                right={
                  <AppText variant="labelMedium" color="secondary">
                    {selectedIds.length} of {MAX_PHOTOS}
                  </AppText>
                }
              />
              <View style={styles.picker}>
                {pins.map((pin) => {
                  const order = selectedIds.indexOf(pin.id);
                  const isSelected = order >= 0;
                  const isBlocked = !isSelected && selectedIds.length >= MAX_PHOTOS;
                  return (
                    <Pressable
                      key={pin.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected, disabled: isBlocked }}
                      disabled={isBlocked}
                      onPress={() => togglePin(pin.id)}
                      style={[
                        styles.pickerTile,
                        { backgroundColor: theme.palette.surfaceVariant },
                        isSelected && { borderColor: theme.palette.primary },
                        isBlocked && styles.pickerTileBlocked,
                      ]}
                    >
                      <Image source={{ uri: getPinThumbnailUri(pin) }} style={styles.pickerImage} />
                      {isSelected ? (
                        <View style={[styles.orderBadge, { backgroundColor: theme.palette.primary }]}>
                          <AppText variant="labelSmall" color="inverse">
                            {order + 1}
                          </AppText>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </ScrollView>

        <AppButton
          label="Share"
          size="lg"
          icon="share-variant"
          loading={isSharing}
          disabled={isSharing}
          onPress={handleShare}
          style={styles.shareButton}
        />
      </ScreenContainer>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  map: {
    aspectRatio: 4 / 3,
  },
  attribution: {
    position: "absolute",
    right: spacing.xs,
    bottom: spacing.xs,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  attributionText: {
    color: "#3A2E22",
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.md,
  },
  cardTitles: {
    gap: spacing.xxs,
  },
  cardPhotos: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  cardPhoto: {
    flex: 1,
    borderRadius: radii.md,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  hint: {
    textAlign: "center",
    marginTop: spacing.sm,
  },
  picker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  pickerTile: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    borderWidth: 3,
    borderColor: "transparent",
    overflow: "hidden",
  },
  pickerTileBlocked: {
    opacity: 0.35,
  },
  pickerImage: {
    width: "100%",
    height: "100%",
  },
  orderBadge: {
    position: "absolute",
    top: spacing.xxs,
    right: spacing.xxs,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButton: {
    marginVertical: spacing.sm,
  },
});
