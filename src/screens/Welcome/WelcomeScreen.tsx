import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppButton, AppText } from "@/components";
import { getRandomQuote } from "@/constants/quotes";
import { spacing, useAppTheme } from "@/theme";

export type WelcomeScreenProps = {
  onGetStarted: () => void;
};

/**
 * Always shown before the main tab navigator (see `RootNavigator`) — not
 * gated by a "seen it once" flag, so it's a deliberate re-entry moment
 * every launch rather than a one-time onboarding step.
 */
export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const theme = useAppTheme();
  // Picked once per mount (i.e. once per app launch), not per render.
  const [quote] = useState(getRandomQuote);

  return (
    <View style={[styles.container, { backgroundColor: theme.palette.background }]}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="compass-outline" size={56} color={theme.palette.primary} />

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
      </View>

      <AppButton label="Get Started" onPress={onGetStarted} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
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
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xxs,
    alignItems: "center",
  },
  quoteText: {
    textAlign: "center",
    fontStyle: "italic",
  },
  button: {
    alignSelf: "stretch",
  },
});
