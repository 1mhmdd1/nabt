import { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { Screen, GoldButton } from "../src/components/Chrome";
import { BackBar } from "../src/components/NodeChrome";
import { C, t } from "../src/theme";
import { eventByCode } from "../src/live/eventCheckin";

/** Reads the organizer's check-in QR. Attendance is written only by the check-in screen it opens, with the code. */
function checkInPath(text: string) {
  const hit = text.match(/\/e\/([^/?#]+)\/checkin\?code=([A-Za-z0-9]+)/);
  return hit ? `/e/${hit[1]}/checkin?code=${hit[2]}` : "";
}

export default function Scan() {
  const [perm, requestPerm] = useCameraPermissions();
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const done = useRef(false);
  const web = Platform.OS === "web";

  function open(path: string) {
    if (done.current) return;
    done.current = true;
    router.replace(path as never);
  }

  async function typed() {
    const value = code.trim();
    if (!value) return;
    const path = checkInPath(value);
    if (path) return open(path);
    setBusy(true);
    setNote("");
    try {
      const eventId = await eventByCode(value);
      open(`/e/${eventId}/checkin?code=${encodeURIComponent(value.toUpperCase())}`);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "That code didn’t work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackBar title="Event check-in" />
      <View style={{ paddingHorizontal: 24, alignItems: "center" }}>
        <Text style={[t(400, 14, 21), { marginTop: 10, textAlign: "center", color: C.w80 }]}>
          Point your camera at the organizer’s QR at the event.
        </Text>
        <View style={styles.frame}>
          {!web && perm?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={({ data }) => {
                const path = checkInPath(String(data || ""));
                if (path) open(path);
                else setNote("That QR isn’t an event check-in.");
              }}
            />
          ) : !web ? (
            <Pressable accessibilityRole="button" onPress={() => void requestPerm()} style={styles.allow}>
              <Text style={t(600, 14, 18)}>Allow camera</Text>
            </Pressable>
          ) : null}
          <Corner style={{ top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }} />
          <Corner style={{ top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }} />
          <Corner style={{ bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }} />
          <Corner style={{ bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }} />
        </View>
        <Text style={[t(400, 12.5, 18), { marginTop: 18, color: C.w64, textAlign: "center" }]}>Camera access is used only for scanning.</Text>
        <View style={{ width: "100%", marginTop: 16 }}>
          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            placeholder="Or type the code under the QR"
            placeholderTextColor={C.w64}
            style={styles.input}
            accessibilityLabel="Check-in code"
          />
          <View style={{ marginTop: 12 }}>
            <GoldButton label={busy ? "Checking…" : "Check in"} onPress={() => void typed()} />
          </View>
          {note ? <Text style={[t(500, 13, 18), { marginTop: 10, color: C.w80, textAlign: "center" }]}>{note}</Text> : null}
        </View>
      </View>
    </Screen>
  );
}

function Corner({ style }: { style: object }) {
  return <View style={[{ position: "absolute", width: 28, height: 28, borderColor: C.white }, style]} />;
}

const styles = StyleSheet.create({
  frame: { width: 230, height: 230, marginTop: 22, borderRadius: 12, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  allow: { height: 40, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.45)", alignItems: "center", justifyContent: "center" },
  input: { height: 48, borderRadius: 14, backgroundColor: C.card, paddingHorizontal: 14, ...t(500, 16, 20), color: C.white },
});
