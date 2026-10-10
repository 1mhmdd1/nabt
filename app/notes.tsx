import { Text, View } from "react-native";
import { Screen } from "../src/components/Chrome";
import { BackBar, useScreenReady } from "../src/components/NodeChrome";
import { C, t } from "../src/theme";
import { useNodeRewards } from "../src/live/nodeRewards";
import { ScrollBody } from "../src/components/ScrollBody";

export default function MyNotes() {
  const notes = useNodeRewards((s) => s.myNotes);
  const ready = useNodeRewards((s) => s.ready);
  useScreenReady("phone-s59", ready && notes.length > 0);
  return (
    <Screen>
      <BackBar title="My notes" />
      <ScrollBody contentContainerStyle={{ paddingHorizontal: 24, gap: 10, paddingBottom: 24 }}>
        {notes.map((note) => (
          <View key={note.id} style={{ borderRadius: 18, backgroundColor: C.card, padding: 14 }}>
            <Text style={[t(600, 11, 14), { letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 }]}>{note.state}</Text>
            <Text style={[t(500, 12, 16), { marginTop: 4, color: C.w64 }]}>{note.place}</Text>
            <Text style={[t(500, 16, 22), { marginTop: 8 }]}>“{note.text}”</Text>
          </View>
        ))}
        <Text style={[t(500, 12, 17), { marginTop: 8, color: C.w64, textAlign: "center" }]}>
          Notes clear from the node every night. Your copy stays here.
        </Text>
      </ScrollBody>
    </Screen>
  );
}
