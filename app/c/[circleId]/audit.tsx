import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../../../src/components/Chrome";
import { Card, Muted, SubHead } from "../../../src/community/ui";
import { t } from "../../../src/theme";
import { useCampus } from "../../../src/live";
import { useCommunity } from "../../../src/live/communities";
import { ChairOnly } from "../../../src/community/ChairOnly";

export default function CircleAudit() {
  return (
    <ChairOnly>
      <CircleAuditScreen />
    </ChairOnly>
  );
}

function CircleAuditScreen() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const id = circleId || "";
  const circle = useCampus((s) => s.circles[id]);
  const audit = useCommunity((s) => s.audit);
  const rows = audit[id] || [];

  return (
    <Screen>
      <SubHead title="Audit log" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}>
        <Text style={t(600, 26, 32)}>Board audit log</Text>
        <Muted>Board only · {circle?.name}</Muted>
        {rows.length === 0 ? (
          <Card>
            <Text style={t(600, 16, 22)}>No entries yet</Text>
            <Muted>Role changes, corrections and approvals show up here. Members of this Circle can read them.</Muted>
          </Card>
        ) : rows.map((row) => (
          <View key={row.id} style={{ paddingVertical: 8 }}>
            <Text style={t(600, 15, 21)}>{row.action}</Text>
            <Muted>{row.actor}{row.when ? ` · ${row.when}` : ""}</Muted>
          </View>
        ))}
        <Card>
          <Text style={t(500, 14, 21)}>Removing members, deleting data and budget changes need a second board approval.</Text>
          <Muted>Any member can ask Student Affairs to review how this Circle is run. Only the Circle name and the request are shared.</Muted>
        </Card>
      </ScrollView>
    </Screen>
  );
}
