import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { Screen } from "../../src/components/Chrome";
import { BackBar } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { getFirebase } from "../../src/firebase";
import { me, useCampus } from "../../src/live";

type Msg = { id: string; authorUid: string; text: string; name: string };

export default function DirectChat() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const id = String(chatId || "");
  const self = useCampus();
  const [title, setTitle] = useState("Chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  useEffect(() => {
    const { db } = getFirebase();
    const stopChat = onSnapshot(doc(db, "chats", id), (snap) => setTitle(String(snap.data()?.title || "Chat")));
    const stopMsgs = onSnapshot(query(collection(db, "chats", id, "messages"), orderBy("createdAt", "asc")), (snap) => {
      setMessages(snap.docs.map((row) => ({ id: row.id, authorUid: String(row.data().authorUid || ""), text: String(row.data().text || ""), name: String(row.data().authorNickname || "") })));
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
        {messages.map((msg) => (
          <View key={msg.id} style={{ alignSelf: msg.authorUid === me() ? "flex-end" : "flex-start", maxWidth: "86%", backgroundColor: C.card, borderRadius: 16, padding: 12 }}>
            <Text style={[t(600, 12, 16), { color: C.w64 }]}>{msg.name}</Text>
            <Text style={[t(400, 15, 21), { marginTop: 2 }]}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
        <TextInput value={text} onChangeText={setText} placeholder="Message" placeholderTextColor={C.w64} style={{ flex: 1, height: 46, borderRadius: 23, backgroundColor: C.card, paddingHorizontal: 14, ...t(500, 15, 20) }} />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            const body = text.trim();
            if (!body) return;
            setText("");
            const { auth, db } = getFirebase();
            void addDoc(collection(db, "chats", id, "messages"), {
              authorUid: me(),
              authorNickname: self.fullName || self.greetingName || "A student",
              text: body,
              kind: "text",
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
