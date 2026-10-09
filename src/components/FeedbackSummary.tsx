import { Text, View } from "react-native";
import { C, t } from "../theme";
import type { FeedbackAggregate } from "../live/records";

export function FeedbackSummary({ row }: { row: FeedbackAggregate }) {
  if (!row.count) return null;
  return (
    <View style={{ marginTop: 14, backgroundColor: C.card, borderRadius: 18, padding: 14 }}>
      <Text style={[t(600, 11, 14), { letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 }]}>Feedback</Text>
      <Text style={[t(700, 28, 32), { marginTop: 6 }]}>{row.average.toFixed(1)}</Text>
      <Text style={[t(500, 13, 18), { color: C.w64 }]}>{row.count} {row.count === 1 ? "reply" : "replies"} · no names</Text>
      <View style={{ marginTop: 10 }}>
        {["5", "4", "3", "2", "1"].map((key) => {
          const n = row.distribution[key] || 0;
          const width = row.count ? Math.round((n / row.count) * 100) : 0;
          return (
            <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Text style={[t(600, 13, 16), { width: 14 }]}>{key}</Text>
              <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.14)" }}>
                <View style={{ width: `${width}%`, height: "100%", borderRadius: 3, backgroundColor: C.white }} />
              </View>
              <Text style={[t(500, 12, 16), { color: C.w64, width: 18, textAlign: "right" }]}>{n}</Text>
            </View>
          );
        })}
      </View>
      {row.comments.length ? (
        <View style={{ marginTop: 6 }}>
          {row.comments.map((comment) => (
            <Text key={comment} style={[t(400, 14, 20), { color: C.w80, marginTop: 6 }]}>“{comment}”</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
