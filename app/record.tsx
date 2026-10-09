import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../src/components/Chrome";
import { BackBar } from "../src/components/NodeChrome";
import { C, t } from "../src/theme";
import { recordSvg, roleLabel, shareSvg, totalsLine, useMyRecord, type RecordItem } from "../src/live/records";

export default function MyRecord() {
  const record = useMyRecord();
  const items = record?.items || [];
  const semesters = [...new Set(items.map((item) => item.semester || "This year"))];
  return (
    <Screen>
      <BackBar title="My record" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}>
        <Text style={t(700, 28, 34)}>{record?.fullName || "Your record"}</Text>
        <Text style={[t(500, 14, 20), { color: C.w64, marginTop: 6 }]}>
          {record ? totalsLine(record.totals) : "Events, training, and roles"}
        </Text>
        <Text style={[t(500, 13, 18), { color: C.w64, marginTop: 4 }]}>Private to you. It stays.</Text>
        {semesters.map((semester) => (
          <View key={semester}>
            <Text style={[t(600, 11, 14), { letterSpacing: 1.2, textTransform: "uppercase", color: C.w64, marginTop: 18, marginBottom: 8 }]}>{semester}</Text>
            <View style={{ backgroundColor: C.card, borderRadius: 18, overflow: "hidden" }}>
              {items.filter((item) => (item.semester || "This year") === semester).map((item, index) => (
                <RecordRow key={item.id} item={item} first={index === 0} />
              ))}
            </View>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (!record) return;
            void shareSvg("nabt-record.svg", recordSvg(record), totalsLine(record.totals));
          }}
          style={{ marginTop: 18, height: 52, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={[t(700, 16, 20), { color: C.burgundy }]}>Export my record</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function RecordRow({ item, first }: { item: RecordItem; first: boolean }) {
  return (
    <Pressable
      onPress={() => item.certificateId && router.push(`/certificate/${item.certificateId}` as never)}
      style={{ paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: first ? 0 : 1, borderTopColor: "rgba(255,255,255,0.08)" }}
    >
      <Text style={t(600, 15, 20)}>{item.title}</Text>
      <Text style={[t(500, 13, 18), { color: C.w64, marginTop: 2 }]}>
        {item.circle} · {item.dateLabel} · {roleLabel(item.role)}{item.code ? ` · ${item.code}` : ""}
      </Text>
    </Pressable>
  );
}
