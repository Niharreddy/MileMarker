import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import {
  AppText,
  Card,
  EmptyState,
  ScreenContainer,
  SectionHeader,
  StatRow,
  type IconName,
} from "@/components";
import { computeDriveStats, useDriveStore, type MonthlyDistance } from "@/features/drives";
import { useSettingsStore, type UnitPreference } from "@/store";
import { radii, spacing, useAppTheme } from "@/theme";
import { formatDate, formatDistance, formatMinutes, formatMonthYear } from "@/utils";

const CHART_HEIGHT = 140;
const MAX_BAR_WIDTH = 18;

function formatDays(count: number) {
  return `${count} ${count === 1 ? "day" : "days"}`;
}

/**
 * Distance per month for the trailing year, as a single-series bar chart.
 * Tapping a bar selects it and shows its exact figures in the readout
 * above — the touch equivalent of a hover tooltip — so the bars themselves
 * stay unlabeled and thin.
 */
function MonthlyDistanceChart({ months, unit }: { months: MonthlyDistance[]; unit: UnitPreference }) {
  const theme = useAppTheme();
  // Default to the latest month that has data, falling back to the current month.
  const [selectedKey, setSelectedKey] = useState(() => {
    const latestWithData = [...months].reverse().find((month) => month.distanceMeters > 0);
    return (latestWithData ?? months[months.length - 1])?.key;
  });

  const maxDistance = Math.max(...months.map((month) => month.distanceMeters), 0);
  const selected = months.find((month) => month.key === selectedKey) ?? months[months.length - 1];

  return (
    <View style={styles.chart}>
      {selected ? (
        <View style={styles.readout}>
          <View>
            <AppText variant="labelMedium" color="secondary">
              {formatMonthYear(selected.monthStart)}
            </AppText>
            <AppText variant="headlineMedium">{formatDistance(selected.distanceMeters, unit)}</AppText>
          </View>
          <AppText variant="labelMedium" color="secondary">
            {selected.driveCount} {selected.driveCount === 1 ? "drive" : "drives"}
          </AppText>
        </View>
      ) : null}

      <View style={[styles.plot, { borderBottomColor: theme.palette.border }]}>
        {months.map((month) => {
          const isSelected = month.key === selected?.key;
          const barHeight =
            maxDistance > 0 && month.distanceMeters > 0
              ? Math.max(4, (month.distanceMeters / maxDistance) * CHART_HEIGHT)
              : 0;
          return (
            <Pressable
              key={month.key}
              accessibilityRole="button"
              accessibilityLabel={`${formatMonthYear(month.monthStart)}: ${formatDistance(month.distanceMeters, unit)}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => setSelectedKey(month.key)}
              // The whole column is the touch target, not just the (possibly tiny) bar.
              style={styles.column}
            >
              <View
                style={[
                  styles.bar,
                  barHeight > 0
                    ? { height: barHeight, backgroundColor: theme.palette.primary, opacity: isSelected ? 1 : 0.4 }
                    : // An empty month still gets a faint stub on the baseline, so it reads as "zero", not "missing".
                      { height: 2, backgroundColor: isSelected ? theme.palette.primary : theme.palette.border },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.axis}>
        {months.map((month) => {
          const isSelected = month.key === selected?.key;
          return (
            <View key={month.key} style={styles.axisLabel}>
              <AppText
                variant="labelSmall"
                color={isSelected ? "primary" : "secondary"}
                style={isSelected ? styles.axisLabelSelected : undefined}
              >
                {new Date(month.monthStart).toLocaleDateString(undefined, { month: "narrow" })}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function HighlightTile({ icon, value, label, detail }: { icon: IconName; value: string; label: string; detail?: string }) {
  const theme = useAppTheme();

  return (
    <Card style={styles.highlightTile}>
      <View style={[styles.iconCircle, { backgroundColor: theme.palette.primaryContainer }]}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.palette.onPrimaryContainer} />
      </View>
      <AppText variant="headlineMedium">{value}</AppText>
      <AppText variant="labelMedium" color="secondary">
        {label}
      </AppText>
      {detail ? (
        <AppText variant="bodySmall" color="secondary">
          {detail}
        </AppText>
      ) : null}
    </Card>
  );
}

function RecordRow({
  icon,
  label,
  value,
  detail,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  detail: string;
  onPress?: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Card onPress={onPress} style={styles.recordRow}>
      <View style={[styles.iconCircle, { backgroundColor: theme.palette.primaryContainer }]}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.palette.onPrimaryContainer} />
      </View>
      <View style={styles.recordText}>
        <AppText variant="labelMedium" color="secondary">
          {label}
        </AppText>
        <AppText variant="titleMedium">{value}</AppText>
        <AppText variant="bodySmall" color="secondary" numberOfLines={1}>
          {detail}
        </AppText>
      </View>
      {onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.palette.textDisabled} />
      ) : null}
    </Card>
  );
}

/** Lifetime totals, distance per month, driving streaks, and personal records — all derived from saved drives. */
export function StatsScreen() {
  const navigation = useNavigation();
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const pastDrives = useDriveStore((state) => state.pastDrives);
  const stats = useMemo(() => computeDriveStats(pastDrives), [pastDrives]);

  if (stats.driveCount === 0) {
    return (
      <ScreenContainer edges={["bottom", "left", "right"]}>
        <EmptyState
          icon="chart-bar"
          title="No stats yet"
          message="Record your first drive and your distance, streaks, and records will show up here."
        />
      </ScreenContainer>
    );
  }

  const biggestMonth = stats.monthly.reduce<MonthlyDistance | null>(
    (best, month) => (month.distanceMeters > (best?.distanceMeters ?? 0) ? month : best),
    null
  );
  const { longestByDistance, longestByDuration } = stats;

  return (
    <ScreenContainer scrollable edges={["bottom", "left", "right"]}>
      <Card style={styles.topCard}>
        <StatRow
          items={[
            {
              icon: "map-marker-distance",
              label: "Distance",
              value: formatDistance(stats.totalDistanceMeters, unitPreference),
            },
            { icon: "road-variant", label: stats.driveCount === 1 ? "Drive" : "Drives", value: String(stats.driveCount) },
            {
              icon: "steering",
              label: "Driving",
              value: formatMinutes(Math.round(stats.totalDurationMs / 60_000)),
            },
          ]}
        />
      </Card>

      <SectionHeader title="Distance by month" />
      <Card>
        <MonthlyDistanceChart months={stats.monthly} unit={unitPreference} />
      </Card>

      <SectionHeader title="Streaks" />
      <View style={styles.highlightRow}>
        <HighlightTile
          icon="fire"
          value={formatDays(stats.currentStreakDays)}
          label="Current streak"
          detail={stats.currentStreakDays === 0 ? "Drive today to start one" : "Days in a row with a drive"}
        />
        <HighlightTile
          icon="trophy-outline"
          value={formatDays(stats.longestStreakDays)}
          label="Longest streak"
          detail={stats.longestStreakEndedAt ? `Ended ${formatDate(stats.longestStreakEndedAt)}` : undefined}
        />
      </View>
      <AppText variant="bodySmall" color="secondary" style={styles.footnote}>
        You've driven on {formatDays(stats.daysDriven)} in total.
      </AppText>

      <SectionHeader title="Records" />
      {longestByDistance ? (
        <RecordRow
          icon="map-marker-distance"
          label="Longest drive"
          value={formatDistance(longestByDistance.distanceMeters, unitPreference)}
          detail={`${longestByDistance.name} · ${formatDate(longestByDistance.startedAt)}`}
          onPress={() => navigation.navigate("Drive", { driveId: longestByDistance.driveId })}
        />
      ) : null}
      {longestByDuration ? (
        <RecordRow
          icon="clock-outline"
          label="Most time behind the wheel"
          value={formatMinutes(Math.max(1, Math.round(longestByDuration.durationMs / 60_000)))}
          detail={`${longestByDuration.name} · ${formatDate(longestByDuration.startedAt)}`}
          onPress={() => navigation.navigate("Drive", { driveId: longestByDuration.driveId })}
        />
      ) : null}
      {biggestMonth ? (
        <RecordRow
          icon="calendar-star"
          label="Biggest month (past year)"
          value={formatDistance(biggestMonth.distanceMeters, unitPreference)}
          detail={`${formatMonthYear(biggestMonth.monthStart)} · ${biggestMonth.driveCount} ${
            biggestMonth.driveCount === 1 ? "drive" : "drives"
          }`}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topCard: {
    marginTop: spacing.sm,
  },
  chart: {
    gap: spacing.sm,
  },
  readout: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  plot: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: CHART_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  column: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: "60%",
    maxWidth: MAX_BAR_WIDTH,
    // Rounded at the data end only; the bar sits square on the baseline.
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
  },
  axis: {
    flexDirection: "row",
  },
  axisLabel: {
    flex: 1,
    alignItems: "center",
  },
  axisLabelSelected: {
    fontWeight: "800",
  },
  highlightRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  highlightTile: {
    flex: 1,
    gap: spacing.xxs,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  footnote: {
    marginTop: spacing.sm,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  recordText: {
    flex: 1,
    gap: spacing.xxs,
  },
});
