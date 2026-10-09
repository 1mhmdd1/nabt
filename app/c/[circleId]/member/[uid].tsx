import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../../../../src/components/Chrome";
import { Avatar, Card, Eyebrow, Muted, SubHead } from "../../../../src/community/ui";
import { t } from "../../../../src/theme";
import { useCampus } from "../../../../src/live";
import { ROLE_LABEL, useCommunity } from "../../../../src/live/communities";

export default function MemberDetail() {
  const { circleId, uid } = useLocalSearchParams<{ circleId: string; uid: string }>();
  const id = circleId || "";
  const memberMap = useCampus((s) => s.members);
  const contactMap = useCommunity((s) => s.contacts);
  const member = (memberMap[id] || []).find((m) => m.id === uid);
  const contact = (contactMap[id] || []).find((c) => c.id === uid);
  const name = contact?.realName || member?.displayName || "Member";

  return (
    <Screen>
      <SubHead title={name} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Avatar letter={name.slice(0, 1)} />
          <View>
            <Text style={t(600, 22, 28)}>{name}</Text>
            <Muted>{member?.nickname || ""}</Muted>
          </View>
        </View>
        <Card>
          <Eyebrow>Shared on join</Eyebrow>
          <Text style={[t(500, 15, 22), { marginTop: 8 }]}>{contact?.uaEmail || "UA email hidden"}</Text>
          <Muted>{contact?.phone ? contact.phone : "No phone added"}</Muted>
          <Muted>{contact?.trainingAttendance || member?.line || "Training attendance not recorded"}</Muted>
        </Card>
        <Card>
          <Eyebrow>Roles in this Circle</Eyebrow>
          <Text style={[t(600, 16, 22), { marginTop: 8 }]}>
            {(member?.roles || []).length ? (member?.roles || []).map((r) => ROLE_LABEL[r] || r).join(" · ") : "Member"}
          </Text>
          <Muted>Roles apply only inside this Circle. Two at most.</Muted>
        </Card>
      </ScrollView>
    </Screen>
  );
}
