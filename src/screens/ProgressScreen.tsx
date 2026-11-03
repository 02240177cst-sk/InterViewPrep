import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useAuth } from '../AuthContext';
import { Card, Screen } from '../components';
import { getProgress, getStreak, getWeekly } from '../db';
import { useLoad } from '../hooks';
import { useTheme } from '../theme';

export default function ProgressScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [prog, setProg] = useState<Awaited<ReturnType<typeof getProgress>>>({ cats: [], practised: 0, bookmarked: 0 });
  const [streak, setStreak] = useState(0);
  const [week, setWeek] = useState<{ label: string; value: number }[]>([]);

  useLoad(async () => {
    setProg(await getProgress(user!.uid));
    setStreak(await getStreak(user!.uid));
    setWeek(await getWeekly(user!.uid));
  });

  const stat = (value: number | string, label: string) => (
    <Card style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: colors.primary }}>{value}</Text>
      <Text style={{ color: colors.sub, fontSize: 12 }}>{label}</Text>
    </Card>
  );

  return (
    <Screen>
      <ScrollView>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {stat(prog.practised, 'Practised')}
          {stat(prog.bookmarked, 'Bookmarked')}
          {stat(`${streak} 🔥`, 'Day streak')}
        </View>

        <Card>
          <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 10 }}>By category</Text>
          {prog.cats.map((c) => {
            const pct = c.total ? Math.round((c.practised / c.total) * 100) : 0;
            return (
              <View key={c.id} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.text }}>{c.name}</Text>
                  <Text style={{ color: colors.sub }}>{c.practised}/{c.total} · {pct}%</Text>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, marginTop: 4 }}>
                  <View style={{ height: 8, borderRadius: 4, width: `${pct}%`, backgroundColor: colors.primary }} />
                </View>
              </View>
            );
          })}
        </Card>

        <Card>
          <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 10 }}>Questions practised this week</Text>
          <BarChart
            data={week.map((w) => ({ value: w.value, label: w.label, frontColor: colors.primary }))}
            barWidth={24}
            spacing={14}
            noOfSections={4}
            maxValue={Math.max(4, ...week.map((w) => w.value))}
            yAxisThickness={0}
            xAxisColor={colors.border}
            yAxisTextStyle={{ color: colors.sub }}
            xAxisLabelTextStyle={{ color: colors.sub, fontSize: 11 }}
            isAnimated={false}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}