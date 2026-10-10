import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { Screen } from "../../src/components/Chrome";
import { BackBar } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { getFirebase } from "../../src/firebase";
import { blockAuthor, me, reportMessage, useCampus } from "../../src/live";
import { MessageBubble } from "../../src/components/chat/MessageBubble";
import { toast } from "../../src/toast";

type Msg = { id: string; authorUid: string; text: string; name: string; replyTo?: string; at: number };

export default function DirectChat() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const id = String(chatId || "");
  const self = useCampus();
  const [title, setTitle] = useState("Chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const input = useRef<TextInput>(null);
  useEffect(() => {
    const { db } = getFirebase();
    const stopChat = onSnapshot(doc(db, "chats", id), (snap) => setTitle(String(snap.data()?.title || "Chat")));
    const stopMsgs = onSnapshot(query(collection(db, "chats", id, "messages"), orderBy("createdAt", "asc")), (snap) => {
      setMessages(
        snap.docs.map((row) => {
          const data = row.data();
          const created = data.createdAt as { toMillis?: () => number } | number | undefined;
          return {
            id: row.id,
            authorUid: String(data.authorUid || ""),
            text: String(data.text || ""),
            name: String(data.authorNickname || ""),
            replyTo: data.replyTo ? String(data.replyTo) : undefined,
            at: typeof created === "number" ? created : created?.toMillis?.() || 0,
          };
        }),
      );
    });
    return () => {
      stopChat();
      stopMsgs();
    };
  }, [id]);
  return (
    <Screen>
      <BackBar title={title} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 24, gap: 8 }}>
        <Text style={[t(500, 12, 16), { color: C.w64 }]}>Names are shared.</Text>
        {messages.map((msg) => {
          const mine = msg.authorUid === me();
          const quoted = msg.replyTo ? messages.find((m) => m.id === msg.replyTo) : undefined;
          const fail = (what: string) => (err: unknown) => toast(err instanceof Error ? err.message : what);
          return (
            <View key={msg.id}>
              {quoted ? <Text style={[t(500, 12, 16), { color: C.w64, alignSelf: mine ? "flex-end" : "flex-start", marginTop: 10 }]} numberOfLines={1}>↪ {quoted.text}</Text> : null}
              <MessageBubble
                name={msg.name}
                mine={mine}
                text={msg.text}
                time={msg.at ? new Date(msg.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : undefined}
                highlight={replyTo === msg.id}
                onReply={() => {
                  setReplyTo(msg.id);
                  input.current?.focus();
                }}
                onReport={() => reportMessage({ chatId: id, messageId: msg.id }).then(() => toast("Report sent")).catch(fail("Report did not send."))}
                onBlock={() => blockAuthor(msg.authorUid, { messageId: msg.id }).then(() => toast("Blocked")).catch(fail("Could not block."))}
                onCopy={() => Clipboard.setStringAsync(msg.text).then(() => toast("Copied"))}
                onDelete={() => deleteDoc(doc(getFirebase().db, "chats", id, "messages", msg.id)).then(() => toast("Deleted")).catch(fail("Could not delete."))}
              />
            </View>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
        <TextInput ref={input} value={text} onChangeText={setText} placeholder={replyTo ? "Reply…" : "Message"} placeholderTextColor={C.w64} style={{ flex: 1, height: 46, borderRadius: 23, backgroundColor: C.card, paddingHorizontal: 14, ...t(500, 15, 20) }} />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            const body = text.trim();
            if (!body) return;
            setText("");
            const to = replyTo;
            setReplyTo("");
            const { db } = getFirebase();
            void addDoc(collection(db, "chats", id, "messages"), {
              authorUid: me(),
              authorNickname: self.fullName || self.greetingName || "A student",
              text: body,
              kind: "text",
              ...(to ? { replyTo: to } : {}),
              createdAt: serverTimestamp(),
            });
          }}
          style={{ height: 46, paddingHorizontal: 16, borderRadius: 23, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={[t(700, 14, 16), { color: C.burgundy }]}>Send</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
