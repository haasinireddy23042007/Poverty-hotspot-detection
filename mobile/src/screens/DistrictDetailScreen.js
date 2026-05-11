import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDistrict } from '../services/api';
import { BarChart } from 'react-native-chart-kit';
import { Lightbulb, Shield } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

export default function DistrictDetailScreen({ route, navigation }) {
  const { district } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDistrict(district.district)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [district]);

  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  const chartData = {
    labels: ['Lit', 'San', 'Wat', 'U.Wt', 'Stun', 'W.Ane', 'Marr', 'C.Ane'],
    datasets: [{
      data: [
        data.indicators.literacy_rate,
        data.indicators.sanitation_access,
        data.indicators.drinking_water_access,
        data.indicators.underweight_children,
        data.indicators.stunted_children,
        data.indicators.anemia_women,
        data.indicators.child_marriage_rate,
        data.indicators.anemic_children
      ]
    }]
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>{data.district}</Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, data.cluster_label === 'High Poverty' ? styles.badgeHigh : styles.badgeModerate]}>
              <Text style={styles.badgeText}>{data.cluster_label}</Text>
            </View>
            <Text style={styles.mpiText}>MPI: <Text style={styles.mpiValue}>{data.mpi_score.toFixed(1)}</Text></Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Poverty Indicators</Text>
          <BarChart
            data={chartData}
            width={screenWidth - 72}
            height={220}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={{
              backgroundColor: '#162846',
              backgroundGradientFrom: '#162846',
              backgroundGradientTo: '#162846',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
              barPercentage: 0.5,
            }}
            style={{ marginVertical: 8, borderRadius: 8 }}
            verticalLabelRotation={30}
          />
        </View>

        <View style={[styles.card, { borderLeftColor: '#f97316', borderLeftWidth: 4 }]}>
          <View style={styles.cardHeaderRow}>
            <Lightbulb color="#f97316" size={20} />
            <Text style={styles.cardTitleLine}>Recommendations</Text>
          </View>
          {data.recommendations?.map((rec, i) => (
            <Text key={i} style={styles.listItem}>• {rec}</Text>
          ))}
        </View>

        <View style={[styles.card, { borderLeftColor: '#3b82f6', borderLeftWidth: 4 }]}>
          <View style={styles.cardHeaderRow}>
            <Shield color="#3b82f6" size={20} />
            <Text style={styles.cardTitleLine}>Active Schemes</Text>
          </View>
          <View style={styles.chipContainer}>
            {data.schemes?.map((scheme, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{scheme}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  center: { flex: 1, backgroundColor: '#0a1628', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  headerCard: {
    backgroundColor: '#162846', padding: 20, borderRadius: 16, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeHigh: { backgroundColor: 'rgba(239,68,68,0.2)' },
  badgeModerate: { backgroundColor: 'rgba(245,158,11,0.2)' },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#fca5a5' },
  mpiText: { color: '#94a3b8', fontSize: 14 },
  mpiValue: { color: '#f97316', fontWeight: 'bold' },
  card: {
    backgroundColor: '#162846', padding: 20, borderRadius: 16, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  cardTitleLine: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  listItem: { color: '#cbd5e1', fontSize: 14, marginBottom: 8, lineHeight: 20 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: 'rgba(59,130,246,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  chipText: { color: '#60a5fa', fontSize: 12, fontWeight: '600' },
});
