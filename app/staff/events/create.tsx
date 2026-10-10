import { NavSpacer } from "../../../src/components/navSpace";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Avatar, GoldButton, OutlineButton, Sheet, StaffFrame, WhiteButton } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { publishEvent } from "../../../src/live/staff";
import { ScreenDescription } from "../../../src/components/ScreenDescription";

const ALTS = [
  { title: "Hall B · 4:00–6:00 PM", sub: "Same room, after the clash" },
  { title: "Courtyard · 2:00–4:00 PM", sub: "Outdoor · 150 · has a node" },
  { title: "Room 204 · 12:00–2:00 PM", sub: "Seminar · 35 · under capacity" },
];

export default function CreateEvent() {
  const params = useLocalSearchParams<{ clash?: string }>();
  const [open, setOpen] = useState(params.clash === "1");
  const [alt, setAlt] = useState(0);
  const [node, setNode] = useState(true);
  const [pulse, setPulse] = useState(true);
  const [when, setWhen] = useState("Thu 2:00–4:00");
  const [place, setPlace] = useState("Hall B");
  const [description, setDescription] = useState("A debate night for the Circle.");
  const [screen, setScreen] = useState("A debate night for the Circle.");
  const [screenTouched, setScreenTouched] = useState(false);
  return (
    <StaffFrame title="New event" chip="Step 1 of 1" back="/staff/events" goldQuiet>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: open ? 420 : 40 }}>
        <Text style={styles.fl}>Title</Text>
        <View style={[styles.in, styles.focus]}><Text style={t(500, 14, 18)}>Debate night</Text></View>
        <Text style={[styles.fl, { marginTop: 10 }]}>Description</Text>
        <TextInput
          value={description}
          onChangeText={(next) => {
            setDescription(next);
            if (!screenTouched) setScreen(next.slice(0, 90));
          }}
          multiline
          accessibilityLabel="Event description"
          style={[styles.in, t(500, 14, 18), { color: C.white }]}
        />
        <View style={{ marginTop: 10 }}>
          <ScreenDescription value={screen} onChange={(next) => { setScreenTouched(true); setScreen(next); }} />
        </View>
        <Text style={[styles.fl, { marginTop: 10 }]}>Host</Text>
        <View style={styles.in}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Avatar letter="D" size={26} />
            <Text style={t(500, 14, 18)}>Debate Circle</Text>
          </View>
          <Text style={[t(500, 12, 16), { color: C.w64 }]}>Circle ▾</Text>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fl}>When</Text>
            <View style={styles.in}><Text style={t(500, 14, 18)}>{when}</Text></View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fl}>Venue</Text>
            <View style={[styles.in, open && styles.warn]}>
              <Text style={t(500, 14, 18)}>{place}</Text>
              {open ? <Text style={[t(700, 14, 16), { color: C.white }]}>!</Text> : null}
            </View>
          </View>
        </View>
        <Pressable onPress={() => setOpen(true)} style={styles.clash}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M12 4 2.5 20h19z" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
            <Path d="M12 10v4.5M12 17.5v.1" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
          </Svg>
          <Text style={[t(500, 13, 17), { color: C.white, marginLeft: 6 }]}>Clashes with “Debate night prep” · tap to fix</Text>
        </Pressable>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fl}>Capacity</Text>
            <View style={styles.in}>
              <Text style={t(500, 14, 18)}>60</Text>
              <Text style={[t(500, 12, 16), { color: C.w64 }]}>of 80</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fl}>RSVP</Text>
            <View style={styles.in}><Text style={t(500, 14, 18)}>On · waitlist</Text></View>
          </View>
        </View>
        <View style={styles.list}>
          <Toggle label="Hope Node check-in" sub="Tap NFC at the door · +1 petal" on={node} set={setNode} />
          <Row label="Perk for attending" sub="Counts toward the next Bloom" value="+1 petal ▾" />
          <Toggle label="Anonymous mood pulse" sub="One tap after the event · no names" on={pulse} set={setPulse} />
        </View>
        <View style={{ marginTop: 14 }}>
          {open ? (
            <WhiteButton label="Publish to Discover" onPress={() => publishEvent("Debate night", when, place, screen)} />
          ) : (
            <GoldButton label="Publish to Discover" onPress={() => publishEvent("Debate night", when, place, screen)} />
          )}
        </View>
        <NavSpacer />
      </ScrollView>
      {open ? (
        <Sheet title="Hall B is taken 2:00–4:00">
          <View style={styles.cl}>
            <View style={styles.clb}><Text style={t(600, 13, 16)}>Debate night prep</Text><Text style={styles.sub}>Debate Circle · pending request</Text></View>
            <View style={[styles.clb, { borderColor: C.white }]}><Text style={t(600, 13, 16)}>Your event</Text><Text style={styles.sub}>Thu 2:00–4:00 · 60 seats</Text></View>
          </View>
          <Text style={[styles.fl, { marginTop: 14 }]}>Best free options</Text>
          {ALTS.map((a, i) => (
            <Pressable key={a.title} onPress={() => setAlt(i)} style={styles.alt}>
              <View style={[styles.rd, i === alt && styles.rdOn]} />
              <View style={{ flex: 1 }}>
                <Text style={t(600, 14, 18)}>{a.title}</Text>
                <Text style={styles.sub}>{a.sub}</Text>
              </View>
            </Pressable>
          ))}
          <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 10 }]}>Same Circle? You can also merge it with the pending request.</Text>
          <View style={{ marginTop: 12, gap: 6 }}>
            <GoldButton
              label="Move to 4:00–6:00 PM"
              onPress={() => {
                const pick = ALTS[alt];
                setWhen(pick.title.split("·")[1]?.trim() || when);
                setPlace(pick.title.split("·")[0]?.trim() || place);
                setOpen(false);
              }}
            />
            <OutlineButton label="Keep and ask the host" onPress={() => setOpen(false)} />
          </View>
        </Sheet>
      ) : null}
    </StaffFrame>
  );
}

function Toggle({ label, sub, on, set }: { label: string; sub: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <Pressable style={styles.it} onPress={() => set(!on)}>
      <View style={{ flex: 1 }}>
        <Text style={t(600, 14, 18)}>{label}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      <View style={[styles.tg, on && styles.tgOn]}><View style={[styles.knob, on && styles.knobOn]} /></View>
    </Pressable>
  );
}

function Row({ label, sub, value }: { label: string; sub: string; value: string }) {
  return (
    <View style={styles.it}>
      <View style={{ flex: 1 }}>
        <Text style={t(600, 14, 18)}>{label}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      <Text style={[t(500, 12.5, 16), { color: C.w70 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  in: { marginTop: 6, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: C.card, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  focus: { borderWidth: 1.5, borderColor: C.white },
  warn: { borderWidth: 1.5, borderColor: C.white },
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
  clash: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  list: { marginTop: 12, borderRadius: 18, backgroundColor: C.card, overflow: "hidden" },
  it: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  sub: { ...t(500, 12, 16), color: C.w64, marginTop: 2 },
  tg: { width: 42, height: 26, borderRadius: 13, backgroundColor: C.deep, padding: 3 },
  tgOn: { backgroundColor: C.white },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.white },
  knobOn: { marginLeft: "auto", backgroundColor: C.burgundy },
  cl: { flexDirection: "row", gap: 8, marginTop: 12 },
  clb: { flex: 1, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: C.w40 },
  alt: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  rd: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: C.white },
  rdOn: { backgroundColor: C.white },
});
