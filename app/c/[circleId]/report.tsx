import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen, GoldButton } from "../../../src/components/Chrome";
import { Card, Muted, SubHead } from "../../../src/community/ui";
import { C, t } from "../../../src/theme";
import { useCampus } from "../../../src/live";
import { submitReport, useImpact, type BoardSeat } from "../../../src/live/impact";
import { ChairOnly } from "../../../src/community/ChairOnly";

const BOARD = ["chair", "vice_chair", "events", "logistics", "media", "treasurer", "moderator", "hr"];
const LABEL: Record<string, string> = {
  chair: "Chair",
  vice_chair: "Vice",
  events: "Events",
  logistics: "Tech",
  media: "Media",
  treasurer: "Treasurer",
  moderator: "Mod",
  hr: "HR",
};

export default function SemesterReport() {
  return (
    <ChairOnly>
      <SemesterReportScreen />
    </ChairOnly>
  );
}

function SemesterReportScreen() {
  const { circleId, view } = useLocalSearchParams<{ circleId: string; view?: string }>();
  const id = circleId || "";
  const share = view === "share";
  const circle = useCampus((s) => s.circles[id]);
  const members = useCampus((s) => s.members[id]) || [];
  const report = useImpact((s) => s.reports.find((row) => row.circleId === id));
  const stats = useImpact((s) => s.circleStats[id]);
  const [highlights, setHighlights] = useState("");
  const [seeded, setSeeded] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (report && !seeded) {
      setHighlights(report.highlights);
      setSeeded(true);
    }
  }, [report, seeded]);

  const attendance = stats?.attendance?.length ? stats.attendance : report?.attendance || [];
  const eventsHeld = stats?.eventsHeld ?? report?.eventsHeld ?? attendance.length;
  const unique = stats?.uniqueAttendees ?? report?.uniqueAttendees ?? 0;
  const mentorLive = members.filter((member) => (member.roles || []).includes("mentor")).length;
  const mentors = mentorLive || stats?.mentorsTrained || report?.mentorsTrained || 0;
  const liveBoard: BoardSeat[] = members
    .map((member) => {
      const role = (member.roles || []).find((item) => BOARD.includes(item));
      return role ? { role: LABEL[role] || role, nickname: member.nickname || member.displayName } : null;
    })
    .filter((row): row is BoardSeat => Boolean(row));
  const board = liveBoard.length ? liveBoard : report?.board || [];
  const locked = share || report?.status === "submitted" || report?.status === "accepted";

  async function send() {
    setError("");
    try {
      await submitReport(
        id,
        circle?.name || report?.circleName || "Circle",
        report?.id || null,
        highlights,
        { eventsHeld, attendance, uniqueAttendees: unique, mentorsTrained: mentors },
        board,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
    }
  }

  return (
    <Screen>
      <SubHead title={share ? "Summary" : "Semester report"} onBack={() => router.back()} chip={report?.status === "accepted" ? "Accepted" : undefined} chipGold={false} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, gap: 10 }}>
        <Muted>{circle?.name || report?.circleName} · {report?.semester || "Fall 2026"}</Muted>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Tile n={String(eventsHeld)} l="Events" />
          <Tile n={String(unique)} l="People" />
          <Tile n={String(mentors)} l="Mentors" />
        </View>
        <Card>
          <Text style={styles.k}>Attendance</Text>
          {attendance.map((row) => (
            <View key={row.eventId} style={styles.line}>
              <Text style={[t(600, 14, 18), { flex: 1 }]}>{row.title}</Text>
              <Text style={t(600, 14, 18)}>{row.count}</Text>
            </View>
          ))}
        </Card>
        <Card>
          <Text style={styles.k}>Board</Text>
          {board.map((seat) => (
            <Text key={`${seat.role}-${seat.nickname}`} style={[t(500, 14, 20), { marginTop: 4 }]}>{seat.role} · {seat.nickname}</Text>
          ))}
        </Card>
        {typeof report?.avgFeedback === "number" ? (
          <Card>
            <Text style={styles.k}>Average feedback</Text>
            <Text style={[t(700, 22, 26), { marginTop: 4 }]}>{report.avgFeedback}</Text>
          </Card>
        ) : null}
        <Card>
          <Text style={styles.k}>Highlights</Text>
          {locked ? <Text style={[t(400, 15, 22), { marginTop: 6 }]}>{highlights}</Text> : (
            <TextInput value={highlights} onChangeText={setHighlights} multiline placeholder="What went well" placeholderTextColor={C.w64} style={styles.input} />
          )}
        </Card>
        {report?.status === "changes" && report.reviewNote ? <Muted>Student Affairs: {report.reviewNote}</Muted> : null}
        {report?.status === "submitted" ? <Muted>Sent to Student Affairs.</Muted> : null}
        {error ? <Text style={[t(500, 13, 18), { color: C.w80 }]}>{error}</Text> : null}
        {!locked ? <GoldButton label="Submit to Student Affairs" onPress={() => void send()} /> : null}
        {!share ? (
          <Text style={[t(600, 14, 18), { textAlign: "center" }]} onPress={() => router.push(`/c/${id}/report?view=share` as never)}>Shareable summary</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Tile({ n, l }: { n: string; l: string }) {
  return (
    <View style={styles.tile}>
      <Text style={t(700, 22, 26)}>{n}</Text>
      <Muted>{l}</Muted>
    </View>
  );
}

const styles = {
  tile: { flex: 1, backgroundColor: C.raised, borderRadius: 16, padding: 12 },
  k: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase" as const, color: C.w64 },
  line: { flexDirection: "row" as const, alignItems: "center" as const, marginTop: 8 },
  input: { marginTop: 8, minHeight: 72, ...t(400, 15, 22) },
};
