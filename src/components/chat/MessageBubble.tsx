import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, t } from "../../theme";
import { MessageActions, pressHaptic, type MessageActionHandlers } from "./MessageActions";

/**
 * One chat message, used by Circle chats and 1:1 chats. Shows only the nickname, the message and the
 * time. Long-press (400 ms) opens the actions for that message.
 */
export function MessageBubble({
  name,
  initial,
  time,
  mine,
  text,
  children,
  footer,
  thanked,
  highlight,
  showAvatar = true,
  ...actions
}: MessageActionHandlers & {
  name: string;
  initial?: string;
  time?: string;
  mine: boolean;
  text: string;
  /** Replaces the plain text, e.g. a photo, a document or a poll. */
  children?: ReactNode;
  /** Under the bubble, e.g. thanks chips. */
  footer?: ReactNode;
  thanked?: boolean;
  highlight?: boolean;
  showAvatar?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const lit = open || highlight;
  return (
    <View style={[styles.grp, mine && { justifyContent: "flex-end" }]}>
      {!mine && showAvatar ? (
        <View style={styles.av}>
          <Text style={[t(600, 13, 13), { color: C.gold }]}>{initial || name.slice(0, 1)}</Text>
        </View>
      ) : null}
      <View style={{ maxWidth: 262, alignItems: mine ? "flex-end" : "flex-start" }}>
        {mine ? null : (
          <Text style={styles.who}>
            {name}
            {time ? <Text style={{ fontWeight: "500" }}>  {time}</Text> : null}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Long-press for message actions"
          delayLongPress={400}
          onLongPress={() => {
            pressHaptic();
            setOpen(true);
          }}
          style={({ pressed }) => [styles.b, mine && styles.mine, (lit || pressed) && styles.lit]}
        >
          {children ?? <Text style={[t(400, 14.5, 20), { color: mine ? C.ground : C.white }]}>{text}</Text>}
        </Pressable>
        {footer}
        {thanked ? <Text style={styles.thanked}>Thanked</Text> : null}
        {mine && time ? <Text style={styles.time}>{time}</Text> : null}
      </View>
      <MessageActions open={open} mine={mine} preview={text || name} thanked={thanked} onClose={() => setOpen(false)} {...actions} />
    </View>
  );
}

const styles = StyleSheet.create({
  grp: { flexDirection: "row", gap: 8, marginTop: 18, alignItems: "flex-start" },
  av: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  who: { ...t(600, 12, 14), color: C.w64, marginBottom: 4 },
  b: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 16, borderBottomLeftRadius: 4, backgroundColor: C.bubble, borderWidth: 1.5, borderColor: "transparent" },
  mine: { backgroundColor: C.white, borderBottomLeftRadius: 16, borderBottomRightRadius: 4 },
  lit: { borderColor: C.gold },
  thanked: { ...t(600, 11, 14), color: C.w70, marginTop: 4 },
  time: { ...t(500, 11, 14), color: C.w64, marginTop: 4 },
});
