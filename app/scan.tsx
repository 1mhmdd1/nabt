import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen, GoldButton } from "../src/components/Chrome";
import { BackBar, useScreenReady } from "../src/components/NodeChrome";
import { C, t } from "../src/theme";
import { markEventPresent, useNodeRewards } from "../src/live/nodeRewards";

export default function Scan() {
  const ready = useNodeRewards((s) => s.ready);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  useScreenReady("phone-s58", ready);
  return (
    <Screen>
      <BackBar title="Scan node QR" />
      <View style={{ paddingHorizontal: 24, alignItems: "center" }}>
        <Text style={[t(400, 14, 21), { marginTop: 10, textAlign: "center", color: "rgba(255,255,255,0.85)" }]}>
          No NFC? Point your camera at the QR on the node.
        </Text>
        <View style={{ width: 230, height: 230, marginTop: 22 }}>
          <Corner style={{ top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }} />
          <Corner style={{ top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }} />
          <Corner style={{ bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }} />
          <Corner style={{ bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }} />
        </View>
        <Text style={[t(400, 12.5, 18), { marginTop: 18, color: C.w64, textAlign: "center" }]}>Camera access is used only for scanning.</Text>
        <Pressable onPress={() => setOpen(true)} style={{ marginTop: 12 }}>
          <Text style={t(600, 13, 16)}>Camera blocked? Enter the node code</Text>
        </Pressable>
        {open ? (
          <View style={{ width: "100%", marginTop: 14 }}>
            <TextInput
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
              placeholder="engineering"
              placeholderTextColor={C.w64}
              style={{ height: 48, borderRadius: 14, backgroundColor: C.card, paddingHorizontal: 14, ...t(500, 16, 20) }}
              accessibilityLabel="Node code"
            />
            <View style={{ marginTop: 12 }}>
              <GoldButton
                label="Open node"
                onPress={() => {
                  const typed = (code || "engineering").trim();
                  if (typed.startsWith("event:")) {
                    const eventId = typed.slice("event:".length);
                    void markEventPresent(eventId)
                      .catch(() => undefined)
                      .finally(() => router.push(`/e/${eventId}/checkin` as never));
                    return;
                  }
                  router.push(`/n/${typed}` as never);
                }}
              />
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function Corner({ style }: { style: object }) {
  return <View style={[{ position: "absolute", width: 28, height: 28, borderColor: C.white }, style]} />;
}
