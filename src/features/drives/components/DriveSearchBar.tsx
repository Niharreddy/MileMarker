import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppSearchBar, AppText } from "@/components";
import { radii, spacing, useAppTheme } from "@/theme";
import { formatStartedAt } from "@/utils";

import { useDriveStore } from "../store/driveStore";

const MAX_RESULTS = 5;

/** Floating search-by-name (or by review text) over past drives; tapping a result opens Drive detail. */
export function DriveSearchBar() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const pastDrives = useDriveStore((state) => state.pastDrives);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return pastDrives
      .filter(
        (drive) => drive.name.toLowerCase().includes(trimmed) || drive.review.toLowerCase().includes(trimmed)
      )
      .slice(0, MAX_RESULTS);
  }, [query, pastDrives]);

  const handleSelect = (driveId: string) => {
    setQuery("");
    navigation.navigate("Drive", { driveId });
  };

  return (
    <View>
      <AppSearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search your drives"
        elevation={2}
        style={{ backgroundColor: theme.palette.surface }}
      />

      {query.trim().length > 0 ? (
        <View
          style={[
            styles.results,
            theme.shadows.md,
            { backgroundColor: theme.palette.surface, borderColor: theme.palette.border },
          ]}
        >
          {results.length === 0 ? (
            <AppText color="secondary" style={styles.resultRow}>
              No drives match “{query.trim()}”.
            </AppText>
          ) : (
            results.map((drive, index) => (
              <Pressable
                key={drive.id}
                onPress={() => handleSelect(drive.id)}
                android_ripple={{ color: theme.palette.surfaceVariant }}
                style={[
                  styles.resultRow,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.palette.border },
                ]}
              >
                <AppText variant="titleSmall" numberOfLines={1}>
                  {drive.name}
                </AppText>
                <AppText color="secondary" variant="bodySmall">
                  {formatStartedAt(drive.startedAt)}
                </AppText>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  results: {
    marginTop: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  resultRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
