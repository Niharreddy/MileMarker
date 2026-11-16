import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppText } from "@/components";
import { getRandomQuote } from "@/constants/quotes";
import { spacing, useAppTheme } from "@/theme";

/** How long the welcome screen stays up before auto-advancing — long enough to read the headline + quote. */
const AUTO_ADVANCE_MS = 2800;

export type WelcomeScreenProps = {
  onGetStarted: () => void;
};

/**
 * Always shown before the main tab navigator (see `RootNavigator`) — not
 * gated by a "seen it once" flag, so it's a deliberate re-entry moment
 * every launch rather than a one-time onboarding step. Auto-advances after
 * a fixed delay instead of waiting for a tap, so it reads as a beat, not a
 * gate — but a tap anywhere skips straight past it for anyone in a hurry.
 */
export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const theme = useAppTheme();
  // Picked once per mount (i.e. once per app launch), not per render.
  const [quote] = useState(getRandomQuote);

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(onGetStarted, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [onGetStarted]);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue"
      onPress={onGetStarted}
      style={[styles.container, { backgroundColor: theme.palette.background }]}
    >
      <Animated.View style={[styles.content, { opacity: fade }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.palette.primaryContainer }]}>
          <MaterialCommunityIcons name="compass-outline" size={52} color={theme.palette.primary} />
        </View>

        <AppText variant="displayMedium" style={styles.headline}>
          Remember every road.{"\n"}Remember every place.
        </AppText>

        <AppText variant="bodyLarge" color="secondary" style={styles.subheadline}>
          Your personal map of the journeys you&apos;ve taken.
        </AppText>

        <View
          style={[
            styles.quoteCard,
            { backgroundColor: theme.palette.surfaceVariant, borderColor: theme.palette.border },
          ]}
        >
          <AppText variant="bodyMedium" style={styles.quoteText}>
            “{quote.text}”
          </AppText>
          <AppText variant="labelMedium" color="secondary">
            — {quote.author}
          </AppText>
        </View>
      </Animated.View>

      <AppText variant="labelMedium" color="disabled" style={styles.skipHint}>
        Tap anywhere to continue
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  skipHint: {
    textAlign: "center",
    paddingBottom: spacing.lg,
  },
  headline: {
    textAlign: "center",
  },
  subheadline: {
    textAlign: "center",
  },
  quoteCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xxs,
    alignItems: "center",
  },
  quoteText: {
    textAlign: "center",
    fontStyle: "italic",
  },
});
