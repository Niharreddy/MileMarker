import React, { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";

import { AppText } from "@/components";
import { spacing } from "@/theme";

import type { Pin } from "../types";

export type MediaViewerModalProps = {
  pins: Pin[];
  /** Index into `pins` to open on, or null when the viewer is closed. */
  initialIndex: number | null;
  onClose: () => void;
};

function formatMediaTimestamp(createdAt: number) {
  return new Date(createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Full-screen photo/video viewer with prev/next navigation across a trip's pins. */
export function MediaViewerModal({ pins, initialIndex, onClose }: MediaViewerModalProps) {
  const [index, setIndex] = useState(initialIndex ?? 0);

  useEffect(() => {
    if (initialIndex !== null) setIndex(initialIndex);
  }, [initialIndex]);

  const pin: Pin | undefined = pins[index];
  const isOpen = initialIndex !== null && !!pin;

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      {isOpen ? (
        <View style={styles.backdrop}>
          {pin.mediaType === "video" ? (
            <Video
              key={pin.id}
              source={{ uri: pin.uri }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay
            />
          ) : (
            <Image source={{ uri: pin.uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
          )}

          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={26} color="#FFFFFF" />
          </Pressable>

          {index > 0 ? (
            <Pressable style={styles.prevButton} onPress={() => setIndex(index - 1)} hitSlop={12}>
              <MaterialCommunityIcons name="chevron-left" size={36} color="#FFFFFF" />
            </Pressable>
          ) : null}

          {index < pins.length - 1 ? (
            <Pressable style={styles.nextButton} onPress={() => setIndex(index + 1)} hitSlop={12}>
              <MaterialCommunityIcons name="chevron-right" size={36} color="#FFFFFF" />
            </Pressable>
          ) : null}

          <View style={styles.caption}>
            <AppText style={styles.captionText}>{formatMediaTimestamp(pin.createdAt)}</AppText>
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
  closeButton: {
    position: "absolute",
    top: spacing.xl,
    right: spacing.md,
    zIndex: 1,
  },
  prevButton: {
    position: "absolute",
    left: spacing.xs,
    top: "50%",
    marginTop: -18,
  },
  nextButton: {
    position: "absolute",
    right: spacing.xs,
    top: "50%",
    marginTop: -18,
  },
  caption: {
    position: "absolute",
    bottom: spacing.xl,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
  },
  captionText: {
    color: "#FFFFFF",
  },
});
