import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../src/components/Chrome";
import { FloatingNav } from "../src/components/Nav";
import { Card, Muted, SubHead } from "../src/community/ui";
import { C, t } from "../src/theme";
import { useImpact } from "../src/live/impact";

export default function Announcements() {
  const [open, setOpen] = useState(false);
  const rows = useImpact((s) => s.announcements);
  return (
    <Screen>
      <SubHead title="Announcements" onBack={() => router.push("/home" as never)} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, gap: 10 }}>
        {rows.length === 0 ? (
          <Card>
            <Text style={t(600, 16, 22)}>Nothing new</Text>
            <Muted>When Student Affairs or your Circle posts, it lands here.</Muted>
          </Card>
        ) : null}
        {rows.map((item) => (
          <Card key={item.id} onPress={() => item.link?.startsWith("/") ? router.push(item.link as never) : undefined}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={[t(600, 16, 21), { flex: 1 }]}>{item.title}</Text>
              {item.verified ? (
                <View style={styles.badge}><Text style={[t(700, 10, 12), { color: C.burgundy }]}>Verified</Text></View>
              ) : (
                <Text style={[t(600, 11, 14), { color: C.w64 }]}>Circle</Text>
              )}
            </View>
            <Text style={[t(400, 15, 22), { marginTop: 6 }]}>{item.body}</Text>
            <Muted>
              {item.audience === "everyone" ? "Everyone" : item.audience === "faculty" ? item.faculty : "Your Circle"}
              {item.eventDate ? ` · ${item.eventDate}` : ""}
            </Muted>
          </Card>
        ))}
        <Pressable onPress={() => router.push("/discover" as never)}>
          <Text style={t(600, 14, 18)}>You said, we did</Text>
          <Muted>On Discover. What changed after you asked.</Muted>
        </Pressable>
      </ScrollView>
      <FloatingNav active="home" open={open} onToggle={() => setOpen((v) => !v)} />
    </Screen>
  );
}

const styles = {
  badge: { height: 20, paddingHorizontal: 8, borderRadius: 10, backgroundColor: C.gold, alignItems: "center" as const, justifyContent: "center" as const },
};
