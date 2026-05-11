import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getDistricts } from '../services/api';
import { AlertTriangle } from 'lucide-react-native';

export default function DashboardScreen({ navigation }) {
  const { ngoProfile } = useAuth();
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await getDistricts();
      setDistricts(data.districts || []);
    } catch (e) {
      console.log('Failed to load districts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const monitoredDistricts = districts.filter(d => 
    (ngoProfile?.monitored_districts || []).includes(d.district) || d.cluster_label === 'High Poverty'
  );

  const hotspots = districts.filter(d => d.cluster_label === 'High Poverty');

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('DistrictDetail', { district: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.districtName}>{item.district}</Text>
        <View style={[styles.badge, item.cluster_label === 'High Poverty' ? styles.badgeHigh : styles.badgeModerate]}>
          <Text style={[styles.badgeText, item.cluster_label === 'High Poverty' ? styles.badgeTextHigh : styles.badgeTextModerate]}>
            {item.cluster_label}
          </Text>
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>MPI Score</Text>
          <Text style={styles.statValue}>{item.mpi_score.toFixed(1)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Trend</Text>
          <Text style={[styles.statValue, { color: item.poverty_trend_val > 0 ? '#10b981' : '#ef4444' }]}>
            {item.poverty_trend}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={monitoredDistricts.sort((a,b) => b.mpi_score - a.mpi_score)}
        keyExtractor={item => item.district}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.welcomeSection}>
              <Text style={styles.greeting}>NGO Partner Dashboard</Text>
              <Text style={styles.ngoName}>{ngoProfile?.ngo_name || 'Active NGO'}</Text>
            </View>

            {hotspots.length > 0 && (
              <View style={styles.alertSection}>
                <View style={styles.sectionHeader}>
                  <AlertTriangle color="#ef4444" size={16} />
                  <Text style={styles.sectionTitle}>CRITICAL HOTSPOT ALERTS</Text>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={hotspots}
                  keyExtractor={h => h.district}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.alertCard}
                      onPress={() => navigation.navigate('DistrictDetail', { district: item })}
                    >
                      <Text style={styles.alertDistrict}>{item.district}</Text>
                      <Text style={styles.alertMpi}>MPI: {item.mpi_score.toFixed(1)}</Text>
                      <View style={styles.alertAction}>
                        <Text style={styles.alertActionText}>Take Action</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <Text style={styles.sectionTitle}>MY MONITORED DISTRICTS</Text>
            </View>
          </>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No districts found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  center: { flex: 1, backgroundColor: '#0a1628', justifyContent: 'center', alignItems: 'center' },
  welcomeSection: { padding: 20, paddingBottom: 10 },
  greeting: { color: '#94a3b8', fontSize: 14 },
  ngoName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  alertSection: { paddingLeft: 20, marginTop: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  alertCard: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: 16,
    padding: 16,
    width: 160,
    marginRight: 12,
  },
  alertDistrict: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  alertMpi: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  alertAction: { backgroundColor: '#ef4444', paddingVertical: 4, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  alertActionText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  list: { padding: 20, paddingTop: 10 },
  card: {
    backgroundColor: '#162846',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  districtName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeHigh: { backgroundColor: 'rgba(239,68,68,0.2)' },
  badgeModerate: { backgroundColor: 'rgba(245,158,11,0.2)' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  badgeTextHigh: { color: '#fca5a5' },
  badgeTextModerate: { color: '#fcd34d' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, backgroundColor: '#0a1628', padding: 12, borderRadius: 8, marginRight: 8 },
  statLabel: { color: '#64748b', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
  statValue: { color: '#f97316', fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40 },
});
