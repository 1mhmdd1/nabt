import { NavSpacer } from "../src/components/navSpace";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Screen } from "../src/components/Chrome";
import { FloatingNav } from "../src/components/Nav";
import { IconBubble, IconCheck, IconHeartPlain, IconMore, IconRootChip, IconSearch, IconShield } from "../src/components/Icons";
import { Avatar, Card, Muted } from "../src/community/ui";
import { C, t } from "../src/theme";
import { postPromptAnswer, useCampus } from "../src/live";
import { rsvpEvent, signPetition, useCommunity } from "../src/live/communities";
import { useMyYouSaid } from "../src/live/impact";

const PILLS = ["For you", "Circles", "Events", "Places"] as const;

export default function Discover() {
  const [open, setOpen] = useState(false);
  const params = useLocalSearchParams<{ pill?: string }>();
  const initialPill = PILLS.includes(params.pill as (typeof PILLS)[number]) ? (params.pill as (typeof PILLS)[number]) : "For you";
  const [pill, setPill] = useState<(typeof PILLS)[number]>(initialPill);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState(false);
  const [answer, setAnswer] = useState("");
  const [answered, setAnswered] = useState("");
  const campus = useCampus();
  const community = useCommunity();
  const youSaid = useMyYouSaid();
  const query = q.trim().toLowerCase();
  const show = (text: string) => !query || text.toLowerCase().includes(query);
  const circles = Object.values(campus.circles);
  const communities = circles.filter((c) => (c.kind === "community" && c.verified) || c.kind === "support");
  const exam = campus.circles["exam-week"];
  const places = campus.campus.filter((c) => c.icon === "pin");
  const featured = community.events.filter((e) => e.hostType === "sa");
  const events = pill === "Events" ? community.events : featured;

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.titleRow}>
          <Text style={styles.h1}>Discover</Text>
          <Pressable accessibilityLabel="Announcements" onPress={() => router.push("/announcements" as never)} style={{ marginRight: 4 }}>
            <Text style={t(600, 12, 16)}>Announcements</Text>
          </Pressable>
          <Pressable accessibilityLabel="Search" onPress={() => setSearch((v) => !v)} style={styles.iconBtn}>
            <IconSearch />
          </Pressable>
        </View>
        {search ? (
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search campus"
            placeholderTextColor={C.w64}
            style={styles.search}
            accessibilityLabel="Search campus"
          />
        ) : null}
        <View style={styles.pills}>
          {PILLS.map((p) => (
            <Pressable key={p} onPress={() => setPill(p)} style={[styles.pill, pill === p && styles.on]}>
              <Text style={[t(600, 12.5, 13), { color: pill === p ? C.ground : C.white }]}>{p}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 10 }}>
        {pill === "For you" ? (
          <Card onPress={() => router.push("/alumni" as never)}>
            <Text style={t(600, 16, 21)}>Alumni mentors</Text>
            <Muted>A 15-minute chat, a CV review, or career advice.</Muted>
          </Card>
        ) : null}
        {pill === "For you" && youSaid.length > 0 ? (
          <Card>
            <View style={styles.between}>
              <Text style={styles.k}>You said, we did</Text>
              <View style={styles.did}><Text style={[t(700, 10, 12), { color: C.burgundy }]}>We did</Text></View>
            </View>
            {youSaid.map((item) => (
              <Pressable key={item.id} onPress={() => item.link?.startsWith("/") ? router.push(item.link as never) : undefined} style={styles.said}>
                <Text style={t(600, 15, 20)}>{item.title}</Text>
                <Text style={[t(400, 14, 20), { color: C.w80, marginTop: 2 }]}>{item.line}</Text>
                <Muted>{item.date}{item.source ? ` · ${item.source}` : ""}</Muted>
              </Pressable>
            ))}
          </Card>
        ) : null}
        {pill === "For you"
          ? community.petitions.filter((p) => show(`${p.title} ${p.text}`)).map((petition) => (
              <Card key={petition.id}>
                <Text style={styles.k}>Petition</Text>
                <Text style={[t(600, 16, 21), { marginTop: 4 }]}>{petition.title}</Text>
                <Muted>{petition.text}</Muted>
                <Text style={[t(500, 13, 18), { color: C.w80, marginTop: 6 }]}>{petition.signCount} signatures</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Sign ${petition.title}`}
                  onPress={() => void signPetition(petition.id)}
                  style={styles.answerBtn}
                >
                  <Text style={[t(700, 14, 16), { color: C.burgundy }]}>Sign</Text>
                </Pressable>
              </Card>
            ))
          : null}
        {(pill === "For you" || pill === "Circles") &&
          community.stories.filter((s) => show(`${s.author} ${s.body}`)).map((story) => (
            <Card key={story.id} onPress={() => router.push(`/circle/${story.refId || "exam-week"}` as never)}>
              <View style={styles.by}>
                <Avatar letter={story.initial || "M"} />
                <View style={{ flex: 1 }}>
                  <Text style={t(600, 14, 18)}>{story.author}</Text>
                  <Muted>{story.meta}</Muted>
                </View>
                <IconMore />
              </View>
              <Text style={styles.body}>{story.body}</Text>
              <View style={styles.actions}>
                <View style={styles.actRow}><IconHeartPlain /><Text style={styles.act}>Thanks · {story.thanks}</Text></View>
                <View style={styles.actRow}><IconRootChip size={18} /><Text style={styles.act}>+1 root</Text></View>
                <View style={[styles.actRow, { flex: 1 }]}><IconBubble /><Text style={styles.act}>{story.replies} replies</Text></View>
              </View>
              {story.replyText ? (
                <View style={styles.reply}>
                  <Avatar letter={story.replyInitial || "C"} small />
                  <Text style={[t(400, 13.5, 18), { color: C.w80, flex: 1 }]}>
                    <Text style={t(600, 13.5, 18)}>{story.replyAuthor} </Text>
                    {story.replyText}
                  </Text>
                </View>
              ) : null}
            </Card>
          ))}

        {(pill === "For you" || pill === "Events") &&
          events.filter((e) => show(`${e.title} ${e.meta}`)).map((event) => (
            <Card key={event.id} onPress={() => router.push(`/e/${event.id}` as never)}>
              <View style={styles.by}>
                <View style={styles.org}><IconShield size={18} color={C.burgundy} /></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.actRow}>
                    <Text style={t(600, 14, 18)}>{event.hostLabel}</Text>
                    {event.verified ? <Verified /> : null}
                  </View>
                  <Muted>{event.kicker}</Muted>
                </View>
              </View>
              <View style={styles.art}>
                <Svg width="100%" height={132} viewBox="0 0 326 132" preserveAspectRatio="xMidYMid slice">
                  <Circle cx="236" cy="96" r="30" stroke="#fff" strokeOpacity={0.16} fill="none" />
                  <Circle cx="236" cy="96" r="52" stroke="#fff" strokeOpacity={0.11} fill="none" />
                  <Circle cx="236" cy="96" r="76" stroke="#fff" strokeOpacity={0.07} fill="none" />
                  <Circle cx="236" cy="96" r="102" stroke="#fff" strokeOpacity={0.05} fill="none" />
                  <Path d="M0 4.6C-2.9 1.4-3 -3.7 0 -7.2 3 -3.7 2.9 1.4 0 4.6Z" stroke="#fff" strokeOpacity={0.7} strokeWidth={0.55} fill="none" transform="translate(236 92) scale(2.2)" />
                  <Path d="M-1.2 5C-5.8 4.3-8.8 .6-9.3 -3.4-5.3 -2.9-2.3 -.3-1.2 5Z" stroke="#fff" strokeOpacity={0.7} strokeWidth={0.55} fill="none" transform="translate(236 92) scale(2.2)" />
                  <Path d="M1.2 5C5.8 4.3 8.8 .6 9.3 -3.4 5.3 -2.9 2.3 -.3 1.2 5Z" stroke="#fff" strokeOpacity={0.7} strokeWidth={0.55} fill="none" transform="translate(236 92) scale(2.2)" />
                  <Path d="M0 118 C 60 108 110 124 170 116 S 280 106 326 114" stroke="#fff" strokeOpacity={0.14} fill="none" />
                </Svg>
                <View style={styles.date}><Text style={[t(700, 19, 20), { color: C.burgundy }]}>{event.day}</Text><Text style={[t(700, 9, 12), { color: C.burgundy, letterSpacing: 1 }]}>{event.mon}</Text></View>
              </View>
              <Text style={[t(600, 20, 26), { marginTop: 12 }]}>{event.title}</Text>
              <Muted>{event.meta}</Muted>
              <View style={[styles.between, { marginTop: 12 }]}>
                <View style={styles.stack}>
                  {(event.faces || []).map((letter) => (
                    <View key={letter} style={styles.face}><Text style={[t(600, 11, 12), { color: C.gold }]}>{letter}</Text></View>
                  ))}
                  <Text style={[t(500, 12.5, 16), { color: C.w64, marginLeft: 14 }]}>{event.rsvpCount} going</Text>
                </View>
                <Pressable onPress={() => void rsvpEvent(event.id, !community.myRsvps[event.id])} style={styles.going}>
                  <IconCheck size={14} color={C.burgundy} />
                  <Text style={[t(700, 13.5, 16), { color: C.burgundy }]}>Going</Text>
                </Pressable>
              </View>
            </Card>
          ))}

        {pill === "For you" && exam?.prompt ? (
          <Card>
            <View style={styles.between}>
              <Text style={styles.k}>{exam.name} · today’s prompt</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`Open ${exam.name}`} onPress={() => router.push(`/circle/${exam.id}` as never)}>
                <Text style={[t(600, 12.5, 16), { color: C.w80 }]}>Open</Text>
              </Pressable>
            </View>
            <Text style={[t(600, 17, 23), { marginTop: 8 }]}>{exam.prompt}</Text>
            <View style={[styles.stack, { marginTop: 12 }]}>
              {(exam.promptFaces || []).map((letter) => (
                <View key={letter} style={styles.face}><Text style={[t(600, 11, 12), { color: C.gold }]}>{letter}</Text></View>
              ))}
              <Text style={[t(500, 12.5, 16), { color: C.w64, marginLeft: 14 }]}>{exam.promptStat}</Text>
            </View>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="Your answer"
              placeholderTextColor={C.w64}
              accessibilityLabel="Answer today’s prompt"
              style={styles.answer}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const line = answer.trim();
                if (!line) return;
                void postPromptAnswer(exam.id, line).then(() => {
                  setAnswered("Answered.");
                  setAnswer("");
                }).catch((err) => setAnswered(err instanceof Error ? err.message : "Try again."));
              }}
              style={styles.answerBtn}
            >
              <Text style={[t(700, 14, 16), { color: C.burgundy }]}>Answer</Text>
            </Pressable>
            {answered ? <Text style={[t(500, 13, 18), { marginTop: 8, color: C.w80 }]}>{answered}</Text> : null}
          </Card>
        ) : null}

        {pill === "Circles" &&
          communities.filter((c) => show(c.name)).map((c) => (
            <Card key={c.id} onPress={() => router.push((c.kind === "community" ? `/c/${c.id}` : `/circle/${c.id}`) as never)}>
              <View style={styles.between}>
                <Text style={t(600, 16, 21)}>{c.name}</Text>
                {c.verified ? <Text style={styles.verified}>Verified</Text> : null}
              </View>
              <Text style={[styles.body, { marginTop: 6 }]}>{c.charter}</Text>
              <Muted>{c.officialLine || (c.kind === "support" ? "Support circle" : "Official UA club")} · {c.memberCount ?? 0} members</Muted>
            </Card>
          ))}

        {(pill === "For you" || pill === "Places") &&
          (pill === "For you" ? places.slice(0, 1) : places).filter((p) => show(`${p.title} ${p.body}`)).map((place) => (
            <Card key={place.href} onPress={() => router.push(place.href as never)}>
              <View style={styles.place}>
                <View style={styles.placeIc}>
                  <Svg width={24} height={18} viewBox="-12 -11 24 18">
                    <Path d="M0 4.6C-2.9 1.4-3 -3.7 0 -7.2 3 -3.7 2.9 1.4 0 4.6Z" fill="#fff" />
                    <Path d="M-1.2 5C-5.8 4.3-8.8 .6-9.3 -3.4-5.3 -2.9-2.3 -.3-1.2 5Z" fill="#fff" />
                    <Path d="M1.2 5C5.8 4.3 8.8 .6 9.3 -3.4 5.3 -2.9 2.3 -.3 1.2 5Z" fill="#fff" />
                  </Svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={t(600, 14, 18)}>{place.title}</Text>
                  <View style={styles.actRow}>
                    <View style={styles.live} />
                    <Muted>{place.body}</Muted>
                  </View>
                </View>
              </View>
              <View style={styles.map}>
                <Svg width="100%" height={86} viewBox="0 0 326 86">
                  <Path d="M0 30 H326 M120 0 V86" stroke="#fff" strokeOpacity={0.07} strokeWidth={9} />
                  <Rect x="18" y="44" width="80" height="30" rx="5" fill="#4F1D1E" />
                  <Rect x="140" y="42" width="96" height="34" rx="5" fill="#4F1D1E" />
                  <Rect x="254" y="44" width="60" height="30" rx="5" fill="#4F1D1E" />
                  <Rect x="18" y="6" width="84" height="14" rx="4" fill="#4F1D1E" />
                  <Circle cx="188" cy="58" r="13" fill="none" stroke="#fff" strokeOpacity={0.3} />
                  <Circle cx="188" cy="58" r="8" fill="#fff" />
                </Svg>
              </View>
              <Muted>The map shows places, never people.</Muted>
            </Card>
          ))}

        {pill === "Events" && community.events.length === 0 ? (
          <Card>
            <Text style={t(600, 16, 22)}>No published events</Text>
            <Muted>When Student Affairs or a verified Circle publishes one, it lands here.</Muted>
          </Card>
        ) : null}
        {pill === "Circles" && communities.length === 0 ? (
          <Card>
            <Text style={t(600, 16, 22)}>No Circles yet. Start one.</Text>
            <Muted>Verified Circles appear here once Student Affairs confirms them.</Muted>
          </Card>
        ) : null}
        {pill === "Places" && places.length === 0 ? (
          <Card>
            <Text style={t(600, 16, 22)}>No campus places listed</Text>
            <Muted>Places show up here when a campus spot is open.</Muted>
          </Card>
        ) : null}
        {pill === "For you" && community.stories.length === 0 && events.length === 0 && !exam?.prompt && places.length === 0 ? (
          <Card>
            <Text style={t(600, 16, 22)}>Your campus is just waking up.</Text>
            <Muted>Hope Threads, events and places appear here as people share them.</Muted>
          </Card>
        ) : null}
        <NavSpacer />
      </ScrollView>
      <FloatingNav active="discover" open={open} onToggle={() => setOpen((v) => !v)} />
    </Screen>
  );
}

function Verified() {
  return (
    <Svg width={14} height={14} viewBox="0 0 16 16">
      <Circle cx="8" cy="8" r="7" fill="#fff" />
      <Path d="m5 8.2 2 2 4-4.2" fill="none" stroke="#411516" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  titleRow: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h1: { ...t(600, 26, 30), color: C.white, letterSpacing: -0.26 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  search: { height: 40, borderRadius: 12, paddingHorizontal: 12, marginBottom: 8, backgroundColor: C.raised, ...t(500, 14, 18) },
  pills: { flexDirection: "row", gap: 6, paddingBottom: 8 },
  pill: { flex: 1, height: 32, borderRadius: 999, borderWidth: 1, borderColor: C.w40, alignItems: "center", justifyContent: "center" },
  on: { backgroundColor: C.white, borderColor: C.white },
  by: { flexDirection: "row", alignItems: "center", gap: 10 },
  body: { marginTop: 10, ...t(400, 15, 22), color: C.white },
  actions: { marginTop: 12, flexDirection: "row", gap: 14 },
  act: { ...t(600, 12.5, 16), color: C.w80 },
  actRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reply: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.hair, flexDirection: "row", gap: 8 },
  org: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  art: { marginTop: 12, height: 132, borderRadius: 18, backgroundColor: C.deep, overflow: "hidden", position: "relative" },
  date: { position: "absolute", left: 14, top: 14, width: 48, borderRadius: 12, backgroundColor: C.white, alignItems: "center", paddingVertical: 6 },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  stack: { flexDirection: "row", alignItems: "center" },
  face: { width: 26, height: 26, borderRadius: 13, marginRight: -6, backgroundColor: C.deep, borderWidth: 2, borderColor: C.card, alignItems: "center", justifyContent: "center" },
  going: { height: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: C.white, flexDirection: "row", alignItems: "center", gap: 6 },
  outline: { height: 36, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: C.w64, alignItems: "center", justifyContent: "center" },
  verified: { ...t(600, 11, 14), color: C.white, letterSpacing: 0.6 },
  k: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  did: { height: 20, paddingHorizontal: 8, borderRadius: 10, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  said: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.hair },
  place: { flexDirection: "row", gap: 12, alignItems: "center" },
  placeIc: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.deep, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.w16 },
  live: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.white, marginRight: 7 },
  map: { marginTop: 12, height: 86, borderRadius: 16, backgroundColor: C.deep, overflow: "hidden" },
  answer: { marginTop: 12, alignSelf: "stretch", minHeight: 44, borderRadius: 14, backgroundColor: C.ground, paddingHorizontal: 12, ...t(500, 15, 20), color: C.white },
  answerBtn: { marginTop: 10, alignSelf: "stretch", height: 44, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
});
