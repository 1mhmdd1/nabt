import { NavSpacer } from "../../../../src/components/navSpace";
import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { GoldButton, OutlineButton, StaffFrame } from "../../../../src/components/staff/StaffChrome";
import { C, t } from "../../../../src/theme";
import { reviewReport, useImpact } from "../../../../src/live/impact";

const STATUS: Record<string, string> = {
  draft: "With the Chair",
  submitted: "Submitted",
  accepted: "Accepted",
  changes: "Changes asked",
};

export default function ReportReview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const report = useImpact((s) => s.reports.find((row) => row.id === id));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  if (!report) {
    return (
      <StaffFrame title="Semester report" back="/staff/reviews/communities" tab="reviews">
        <Text style={[t(500, 15, 20), { color: C.white, padding: 24 }]}>Opening the report…</Text>
      </StaffFrame>
    );
  }
  const open = report.status === "submitted";
  const reportId = report.id;

  async function review(status: "accepted" | "changes") {
    setError("");
    try {
      await reviewReport(reportId, status, status === "changes" ? note : "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <StaffFrame title="Summary" chip={STATUS[report.status] || report.status} back="/staff/reviews/communities" tab="reviews">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}>
        <Text style={t(700, 22, 28)}>{report.circleName}</Text>
        <Text style={[t(500, 13, 18), { color: C.w64 }]}>{report.semester}</Text>
        <View style={styles.row}>
          <Tile n={String(report.eventsHeld)} l="Events" />
          <Tile n={String(report.uniqueAttendees)} l="People" />
          <Tile n={String(report.mentorsTrained)} l="Mentors" />
        </View>
        {report.attendance.map((row) => (
          <View key={row.eventId} style={styles.line}>
            <Text style={[t(600, 14, 18), { flex: 1 }]}>{row.title}</Text>
            <Text style={t(600, 14, 18)}>{row.count}</Text>
          </View>
        ))}
        <Text style={styles.k}>Board</Text>
        {report.board.map((seat) => (
          <Text key={`${seat.role}-${seat.nickname}`} style={t(500, 14, 20)}>{seat.role} · {seat.nickname}</Text>
        ))}
        {typeof report.avgFeedback === "number" ? <Text style={t(600, 16, 22)}>Average feedback {report.avgFeedback}</Text> : null}
        <Text style={styles.k}>Highlights</Text>
        <Text style={t(400, 15, 22)}>{report.highlights}</Text>
        {open ? (
          <>
            <TextInput value={note} onChangeText={setNote} placeholder="Note, if you ask for changes" placeholderTextColor={C.w64} style={styles.input} />
            {error ? <Text style={[t(500, 13, 18), { color: C.w80 }]}>{error}</Text> : null}
            <GoldButton label="Accept" onPress={() => void review("accepted")} />
            <OutlineButton label="Ask for changes" onPress={() => void review("changes")} />
          </>
        ) : null}
        <NavSpacer />
      </ScrollView>
    </StaffFrame>
  );
}

function Tile({ n, l }: { n: string; l: string }) {
  return (
    <View style={styles.tile}>
      <Text style={t(700, 20, 24)}>{n}</Text>
      <Text style={[t(500, 11, 14), { color: C.w64 }]}>{l}</Text>
    </View>
  );
}

const styles = {
  row: { flexDirection: "row" as const, gap: 8 },
  tile: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 10 },
  line: { flexDirection: "row" as const, backgroundColor: C.card, borderRadius: 12, padding: 12 },
  k: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase" as const, color: C.w64, marginTop: 6 },
  input: { backgroundColor: C.card, borderRadius: 14, padding: 12, minHeight: 64, ...t(500, 14, 20) },
};
