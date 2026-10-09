import { Text, View, useWindowDimensions } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import { demoLocal } from "../../../src/local/mode";
import { LotusArt } from "../../../src/components/LotusArt";
import { LinkQr } from "../../../src/components/LinkQr";
import { useWakeLock } from "../../../src/components/useWakeLock";
import { useScreenReady } from "../../../src/components/NodeChrome";
import { C, t } from "../../../src/theme";
import { checkInUrl, useEventCopy } from "../../../src/live/eventCheckin";

/** Door tablet for one Circle event. Landscape, large QR, the organizer's line, and the time. */
export default function EventDoor() {
  if (demoLocal()) return <Redirect href="/home" />;
  return <EventDoorLive />;
}

function EventDoorLive() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = eventId || "";
  const { width, height } = useWindowDimensions();
  const landscape = width >= height;
  const copy = useEventCopy(id);
  const title = copy.title || "Event";
  const place = copy.place || "Faculty of Engineering";
  const qr = Math.min(landscape ? height * 0.62 : width * 0.72, 560);
  useWakeLock(true);
  useScreenReady("event-door", true);

  return (
    <View style={{ flex: 1, backgroundColor: C.ground, paddingHorizontal: landscape ? 48 : 24, paddingVertical: 28 }}>
      <View style={{ height: 56, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <LotusArt width={42} height={28} />
        <Text style={t(700, 18, 22)}>NABT</Text>
        <Text style={[t(500, 16, 20), { color: C.w64 }]}>· Event check-in</Text>
      </View>
      <View style={{ flex: 1, flexDirection: landscape ? "row" : "column", alignItems: "center", justifyContent: "center", gap: landscape ? 64 : 28 }}>
        <View style={{ flex: landscape ? 1 : undefined, maxWidth: 640 }}>
          <Text style={[t(600, 14, 18), { letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 }]}>Scan to check in</Text>
          <Text style={[t(700, landscape ? 48 : 32, landscape ? 54 : 38), { marginTop: 12 }]}>{title}</Text>
          <Text style={[t(500, 18, 24), { marginTop: 8, color: C.w80 }]}>{place}</Text>
          {copy.screenDescription ? (
            <Text style={[t(500, 18, 26), { marginTop: 14, color: C.w64, maxWidth: 520 }]} numberOfLines={2}>
              {copy.screenDescription}
            </Text>
          ) : null}
          {copy.window ? <Text style={[t(600, 20, 26), { marginTop: 12 }]}>{copy.window}</Text> : null}
        </View>
        <View style={{ alignItems: "center" }}>
          <View style={{ padding: 12, borderRadius: 28, borderWidth: 4, borderColor: C.gold, backgroundColor: C.white }}>
            <LinkQr value={checkInUrl(id)} size={qr} />
          </View>
          <Text style={[t(600, 16, 20), { marginTop: 14 }]}>/e/{id}/checkin</Text>
        </View>
      </View>
    </View>
  );
}
