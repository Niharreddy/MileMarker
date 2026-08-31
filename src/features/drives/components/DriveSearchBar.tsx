import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppSearchBar, AppText } from "@/components";
import { spacing, useAppTheme } from "@/theme";
import { formatStartedAt } from "@/utils";

import { useDriveStore } from "../store/driveStore";

const MAX_RESULTS = 5;

/** Search-by-name over past drives; tapping a result opens Drive detail. */
export function DriveSearchBar() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const pastDrives = useDriveStore((state) => state.pastDrives);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return pastDrives.filter((drive) => drive.name.toLowerCase().includes(trimmed)).slice(0, MAX_RESULTS);
  }, [query, pastDrives]);

  const handleSelect = (driveId: string) => {
    setQuery("");
    navigation.navigate("Drive", { driveId });
  };

  return (
    <View style={styles.container}>
      <AppSearchBar value={query} onChangeText={setQuery} placeholder="Search your drives" />

      {query.trim().length > 0 ? (
        <View
          style={[
            styles.results,
            { backgroundColor: theme.palette.surface, borderColor: theme.palette.border },
          ]}
        >
          {results.length === 0 ? (
            <AppText color="secondary" style={styles.resultRow}>
              No drives match “{query.trim()}”.
            </AppText>
          ) : (
            results.map((drive) => (
              <Pressable key={drive.id} onPress={() => handleSelect(drive.id)} style={styles.resultRow}>
                <AppText variant="titleSmall">{drive.name}</AppText>
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
  container: {
    marginBottom: spacing.sm,
  },
  results: {
    marginTop: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: "hidden",
  },
  resultRow: {
    padding: spacing.sm,
  },
});
