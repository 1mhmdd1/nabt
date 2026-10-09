import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { BackBar } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { useCampus } from "../../src/live";
import { postFn } from "../../src/fn";
import { toast } from "../../src/toast";

export default function Graduate() {
  const campus = useCampus();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setError("");
    setBusy(true);
    try {
      await postFn("/confirm-graduation", { classYear: Number(year) });
      toast("You're an alumnus. Sign out and back in to refresh your role.");
      router.replace("/me" as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm graduation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackBar title="I've graduated" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}>
        {campus.alumni ? (
          <Text style={[t(500, 15, 22), { color: C.w80 }]}>This account is already alumni{campus.classYear ? ` · class of ${campus.classYear}` : ""}.</Text>
        ) : (
          <>
            <Text style={[t(500, 15, 22), { color: C.w80 }]}>
              This switches your account to alumni. Your record stays. You can then offer mentoring under your name.
            </Text>
            <TextInput
              value={year}
              onChangeText={(value) => setYear(value.replace(/[^\d]/g, "").slice(0, 4))}
              keyboardType="number-pad"
              accessibilityLabel="Class year"
              placeholder="Class year"
              placeholderTextColor={C.w64}
              style={{ height: 48, borderRadius: 14, backgroundColor: C.card, paddingHorizontal: 12, marginTop: 16, ...t(500, 16, 20) }}
            />
            {error ? <Text style={[t(500, 13, 18), { color: C.w80, marginTop: 8 }]}>{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm graduation"
              disabled={busy}
              onPress={() => void confirm()}
              style={{ marginTop: 18, height: 52, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", opacity: busy ? 0.6 : 1 }}
            >
              <Text style={[t(700, 16, 20), { color: C.burgundy }]}>{busy ? "Saving…" : "Confirm graduation"}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
