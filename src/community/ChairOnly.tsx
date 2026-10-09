import { ReactNode } from "react";
import { ScrollView, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../components/Chrome";
import { me, useCampus } from "../live";
import { t } from "../theme";
import { Card, Muted, SubHead, ui } from "./ui";

/** Chair-only screens render nothing else for anyone who isn't this Circle's Chair. The server refuses them too. */
export function ChairOnly({ children }: { children: ReactNode }) {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const circle = useCampus((s) => s.circles[String(circleId || "")]);
  if (circle?.chairUid && circle.chairUid === me()) return <>{children}</>;
  return (
    <Screen>
      <SubHead title={circle?.name || "Circle"} />
      <ScrollView contentContainerStyle={ui.pad}>
        <Card>
          <Text style={t(600, 16, 22)}>Chair only</Text>
          <Muted>{circle ? `This is for the Chair of ${circle.name}. Student Affairs assigns the Chair.` : "Opening the Circle…"}</Muted>
        </Card>
      </ScrollView>
    </Screen>
  );
}
