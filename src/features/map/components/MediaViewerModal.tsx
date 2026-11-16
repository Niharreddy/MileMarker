import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components";
import { radii, spacing } from "@/theme";
import { formatStartedAt } from "@/utils";

import { getPinThumbnailUri } from "../pinMedia";
import type { Pin } from "../types";

export type MediaViewerModalProps = {
  pins: Pin[];
  /** Index into `pins` to open on, or null when the viewer is closed. */
  initialIndex: number | null;
  onClose: () => void;
  /** Optional pill button under the caption, e.g. "View drive" — receives whichever pin is showing. */
  actionLabel?: string | ((pin: Pin) => string);
  onAction?: (pin: Pin) => void;
};

/**
 * Full-screen photo/video viewer. Swipe left/right (or use the arrows) to
 * move through the set. Only the page currently in view mounts a real video
 * player — its neighbors show the video's still thumbnail, so swiping past a
 * video doesn't start it playing off-screen.
 */
export function MediaViewerModal({ pins, initialIndex, onClose, actionLabel, onAction }: MediaViewerModalProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<Pin>>(null);
  const [index, setIndex] = useState(initialIndex ?? 0);

  useEffect(() => {
    if (initialIndex !== null) setIndex(initialIndex);
  }, [initialIndex]);

  // A pin can be removed while the viewer's open; never point past the end.
  const safeIndex = Math.min(index, Math.max(0, pins.length - 1));
  const pin: Pin | undefined = pins[safeIndex];
  const isOpen = initialIndex !== null && !!pin;

  const goTo = (nextIndex: number) => {
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setIndex(nextIndex);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width === 0) return;
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(pins.length - 1, page)));
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      {isOpen ? (
        <View style={styles.backdrop}>
          <FlatList
            ref={listRef}
            data={pins}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
            onMomentumScrollEnd={handleScrollEnd}
            // Pages are full-screen, so only the current one and its immediate neighbors are worth keeping mounted.
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            renderItem={({ item, index: itemIndex }) => (
              <View style={{ width, height }}>
                {item.mediaType === "video" && itemIndex === safeIndex ? (
                  <Video
                    source={{ uri: item.uri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls
                    shouldPlay
                  />
                ) : (
                  <>
                    <Image
                      source={{ uri: getPinThumbnailUri(item) }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="contain"
                    />
                    {item.mediaType === "video" ? (
                      <View style={styles.videoPlaceholder}>
                        <MaterialCommunityIcons name="play-circle" size={64} color="rgba(255,255,255,0.85)" />
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            )}
          />

          <View style={[styles.topBar, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
            <View style={styles.pill}>
              <AppText variant="labelMedium" style={styles.lightText}>
                {safeIndex + 1} / {pins.length}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.roundButton}
              onPress={onClose}
              hitSlop={12}
            >
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {safeIndex > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous"
              style={[styles.roundButton, styles.prevButton]}
              onPress={() => goTo(safeIndex - 1)}
              hitSlop={12}
            >
              <MaterialCommunityIcons name="chevron-left" size={30} color="#FFFFFF" />
            </Pressable>
          ) : null}

          {safeIndex < pins.length - 1 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next"
              style={[styles.roundButton, styles.nextButton]}
              onPress={() => goTo(safeIndex + 1)}
              hitSlop={12}
            >
              <MaterialCommunityIcons name="chevron-right" size={30} color="#FFFFFF" />
            </Pressable>
          ) : null}

          {/* Kept clear of a video's native control bar, which sits along the very bottom. */}
          <View
            style={[styles.footer, { bottom: insets.bottom + (pin.mediaType === "video" ? 88 : spacing.lg) }]}
            pointerEvents="box-none"
          >
            <View style={styles.pill}>
              <AppText variant="labelMedium" style={styles.lightText}>
                {formatStartedAt(pin.createdAt)}
              </AppText>
            </View>
            {actionLabel && onAction ? (
              <Pressable accessibilityRole="button" style={[styles.pill, styles.actionPill]} onPress={() => onAction(pin)}>
                <AppText variant="labelLarge" style={styles.lightText}>
                  {typeof actionLabel === "function" ? actionLabel(pin) : actionLabel}
                </AppText>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#000000",
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  prevButton: {
    position: "absolute",
    left: spacing.sm,
    top: "50%",
    marginTop: -20,
  },
  nextButton: {
    position: "absolute",
    right: spacing.sm,
    top: "50%",
    marginTop: -20,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: spacing.sm,
  },
  pill: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.5)",
  },
  lightText: {
    color: "#FFFFFF",
  },
});
