import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { collection, onSnapshot } from "firebase/firestore";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Card, Muted } from "../../src/community/ui";
import { IconShield } from "../../src/components/Icons";
import { C, t } from "../../src/theme";
import { useCampus } from "../../src/live";
import { getFirebase } from "../../src/firebase";
import { postFn } from "../../src/fn";
import { toast } from "../../src/toast";

type Row = {
  id: string;
  action: string;
  actor: string;
  target: string;
  when: string;
  category: string;
  chip: string;
  title: string;
  detail: string;
  counselor: string;
};

export default function AdminLog() {
  const role = useCampus((s) => s.role);
  const [rows, setRows] = useState<Row[]>([]);
  const [denied, setDenied] = useState(false);
  const [asAdmin, setAsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"reveal" | "role" | "counselor">("reveal");
  const [email, setEmail] = useState("");
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    const { db } = getFirebase();
    return onSnapshot(
      collection(db, "auditLogs"),
      (snap) => {
        setDenied(false);
        setRows(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              action: String(data.action || "Update"),
              actor: String(data.actor || data.actorUid || ""),
              target: String(data.target || ""),
              when: String(data.when || ""),
              category: String(data.category || "role"),
              chip: String(data.chip || ""),
              title: String(data.title || data.action || "Update"),
              detail: String(data.detail || ""),
              counselor: String(data.counselor || data.actor || ""),
            };
          }),
        );
      },
      (err) => {
        if (err.code === "permission-denied") {
          setDenied(true);
          setRows([]);
          return;
        }
        setError(err.message);
      },
    );
  }, [asAdmin]);

  /** The admin signs in like everyone else; the role claim comes from `make-role.mjs <email> admin`. */
  function openAsAdmin() {
    setError("");
    setAsAdmin(false);
    router.push("/login" as never);
  }

  function backToStudent() {
    router.replace("/home" as never);
  }

  async function promote(next: "staff" | "admin" | "student") {
    setPromoting(true);
    setError("");
    try {
      await postFn("/admin/role", { email: email.trim(), role: next });
      toast(next === "staff" ? "Student Affairs role saved. They should sign in again." : `Role set to ${next}. They should sign in again.`);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change that role.");
    } finally {
      setPromoting(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}>
        {denied ? (
          <>
            <Text style={t(600, 26, 32)}>Campus admin log</Text>
            <Muted>Role changes, approvals, Chair assignments and perk changes. Students, Chairs and Student Affairs do not read this.</Muted>
          <Card>
            <Text style={t(600, 16, 22)}>Admin only</Text>
            <Muted>Signed in as {role || "a student"}. The log stays closed.</Muted>
            <Pressable onPress={openAsAdmin} style={styles.btn}>
              <Text style={[t(700, 14, 18), { color: C.burgundy }]}>Sign in as the campus admin</Text>
            </Pressable>
          </Card>
          </>
        ) : (
          <>
            <Text style={[t(600, 12, 16), { letterSpacing: 0.4 }]}>NABT · Admin</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={t(700, 28, 32)}>Audit</Text>
              <View style={styles.chip}><Text style={t(600, 12, 14)}>{rows.filter((row) => row.category === "reveal").length} this semester</Text></View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["reveal", "role", "counselor"] as const).map((key) => {
                const label = key === "reveal" ? "Identity reveals" : key === "role" ? "Role changes" : "By counselor";
                const on = tab === key;
                return (
                  <Pressable key={key} accessibilityRole="button" accessibilityLabel={label} onPress={() => setTab(key)} style={[styles.pill, on && styles.pillOn]}>
                    <Text style={[t(600, 12, 15), { color: on ? C.burgundy : C.white }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Card>
              <Text style={t(600, 16, 22)}>Set a role</Text>
              <Muted>Promote a signed-up UA email to Student Affairs or campus admin. They sign out and back in to pick it up.</Muted>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                accessibilityLabel="Role email"
                placeholder="UA email"
                placeholderTextColor={C.w64}
                style={{ marginTop: 10, height: 44, borderRadius: 12, backgroundColor: C.ground, paddingHorizontal: 12, ...t(500, 15, 20) }}
              />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <Pressable accessibilityRole="button" accessibilityLabel="Make Student Affairs" disabled={promoting} onPress={() => void promote("staff")} style={styles.btn}>
                  <Text style={[t(700, 13, 16), { color: C.burgundy }]}>Student Affairs</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Make admin" disabled={promoting} onPress={() => void promote("admin")} style={styles.btn}>
                  <Text style={[t(700, 13, 16), { color: C.burgundy }]}>Admin</Text>
                </Pressable>
              </View>
            </Card>
            {rows.filter((row) => (tab === "counselor" ? row.category === "reveal" : row.category === tab)).length === 0 ? (
              <Card>
                <Text style={t(600, 16, 22)}>No entries yet</Text>
                <Muted>Functions write this log. Clients cannot.</Muted>
              </Card>
            ) : null}
            {rows
              .filter((row) => (tab === "counselor" ? row.category === "reveal" : row.category === tab))
              .map((row) => (
                <View key={row.id} style={styles.case}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                    {row.chip ? <View style={styles.chip}><Text style={t(600, 11, 14)}>{row.chip}</Text></View> : <View />}
                    <Text style={t(500, 12, 16)}>{row.when}</Text>
                  </View>
                  <Text style={[t(700, 16, 22), { marginTop: 6 }]}>{row.title}</Text>
                  <Muted>{row.detail || [row.actor, row.target].filter(Boolean).join(" · ")}</Muted>
                </View>
              ))}
            <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              <IconShield size={13} color={C.w64} />
              <Muted>Each reveal also shows in that student’s Privacy log.</Muted>
            </View>
          </>
        )}
        {error ? <Text style={t(500, 13, 18)}>{error}</Text> : null}
        {!denied && rows.length === 0 ? (
          <Card>
            <Text style={t(600, 16, 22)}>No entries yet</Text>
            <Muted>Functions write this log. Clients cannot.</Muted>
          </Card>
        ) : null}
        {asAdmin ? (
          <Pressable onPress={backToStudent} style={{ alignItems: "center", padding: 8 }}>
            <Text style={t(600, 14, 18)}>Return to the student session</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = {
  btn: { marginTop: 12, height: 44, borderRadius: 999, backgroundColor: C.white, alignItems: "center" as const, justifyContent: "center" as const },
  chip: { height: 24, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", justifyContent: "center" as const },
  pill: { height: 30, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.35)", justifyContent: "center" as const },
  pillOn: { backgroundColor: C.white, borderColor: C.white },
  case: { backgroundColor: C.card, borderRadius: 18, padding: 14 },
};
