import { useEffect } from "react";
import { Text, View } from "react-native";
import { Redirect, Stack, usePathname } from "expo-router";
import { C, t } from "../../src/theme";
import { startStaffSession, useStaff } from "../../src/live/staff";

/** Role gate: only an account with the Student Affairs claim stays in this area. */
export default function StaffLayout() {
  const path = usePathname();
  const signin = path === "/staff/signin";
  const ready = useStaff((s) => s.ready);
  const allowed = useStaff((s) => s.allowed);
  const error = useStaff((s) => s.error);

  useEffect(() => {
    if (!signin) void startStaffSession();
  }, [signin]);

  if (!signin && ready && !allowed) {
    if (error === "Sign in to open Student Affairs.") return <Redirect href="/staff/signin" />;
    if (error === "This account is not Student Affairs.") return <Redirect href="/home" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.ground }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: C.ground },
        }}
      />
      {!signin && !ready ? (
        <View style={{ position: "absolute", left: 24, right: 24, top: 120 }}>
          <Text style={[t(500, 15, 20), { color: C.white }]}>Opening Student Affairs…</Text>
        </View>
      ) : null}
    </View>
  );
}
