import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { C, t } from "../../theme";

export type MessageActionHandlers = {
  /** Someone else's message. Hidden when the message can't be thanked. */
  onThanks?: () => void | Promise<void>;
  onReply?: () => void;
  onReport?: () => void | Promise<void>;
  onBlock?: () => void | Promise<void>;
  /** Your own message. */
  onCopy?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
};

type Confirm = { title: string; body: string; label: string; run: () => void | Promise<void> } | null;

/**
 * The long-press sheet for one message: Thanks, Reply, Report and Block on someone else's message;
 * Copy and Delete on your own. Report, Block and Delete ask once before they act.
 */
export function MessageActions({
  open,
  mine,
  preview,
  thanked,
  onClose,
  ...act
}: MessageActionHandlers & { open: boolean; mine: boolean; preview: string; thanked?: boolean; onClose: () => void }) {
  const [confirm, setConfirm] = useState<Confirm>(null);
  const close = () => {
    setConfirm(null);
    onClose();
  };
  const run = (fn?: () => void | Promise<void>) => () => {
    close();
    void Promise.resolve(fn?.());
  };
  const rows: { label: string; onPress: () => void; danger?: boolean }[] = mine
    ? [
        ...(act.onCopy ? [{ label: "Copy", onPress: run(act.onCopy) }] : []),
        ...(act.onDelete
          ? [{ label: "Delete", danger: true, onPress: () => setConfirm({ title: "Delete this message?", body: "It goes for everyone in this chat.", label: "Delete", run: act.onDelete! }) }]
          : []),
      ]
    : [
        ...(act.onThanks ? [{ label: thanked ? "Thanked" : "Thanks", onPress: thanked ? close : run(act.onThanks) }] : []),
        ...(act.onReply ? [{ label: "Reply", onPress: run(act.onReply) }] : []),
        ...(act.onReport
          ? [{ label: "Report", danger: true, onPress: () => setConfirm({ title: "Report this message?", body: "Student Affairs sees the message, not who reported it.", label: "Report", run: act.onReport! }) }]
          : []),
        ...(act.onBlock
          ? [{ label: "Block", danger: true, onPress: () => setConfirm({ title: "Block this person?", body: "You won’t see their messages. They aren’t told.", label: "Block", run: act.onBlock! }) }]
          : []),
      ];
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.scrim} onPress={close} accessibilityLabel="Close message actions" />
      <View style={styles.sheet} accessibilityRole="menu">
        <View style={styles.grab} />
        <Text style={[t(500, 13, 18), { color: C.w64 }]} numberOfLines={2}>
          {preview}
        </Text>
        {confirm ? (
          <View style={{ marginTop: 12, gap: 10 }}>
            <Text style={t(600, 16, 22)}>{confirm.title}</Text>
            <Text style={[t(400, 14, 20), { color: C.w80 }]}>{confirm.body}</Text>
            <Pressable accessibilityRole="button" onPress={run(confirm.run)} style={[styles.row, styles.rowDanger]}>
              <Text style={[t(700, 15, 18), { color: C.burgundy }]}>{confirm.label}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setConfirm(null)} style={styles.row}>
              <Text style={t(600, 15, 18)}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ marginTop: 12, gap: 8 }}>
            {rows.map((row) => (
              <Pressable key={row.label} accessibilityRole="menuitem" onPress={row.onPress} style={styles.row}>
                <Text style={[t(600, 15, 18), row.danger ? { color: C.w80 } : null]}>{row.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

/** Light tap on long-press. Silent where the phone has no haptics. */
export function pressHaptic() {
  if (Platform.OS === "web") return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,4,5,0.55)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", alignSelf: "center", marginBottom: 12 },
  row: { height: 48, borderRadius: 14, backgroundColor: C.raised, alignItems: "center", justifyContent: "center" },
  rowDanger: { backgroundColor: C.white },
});
