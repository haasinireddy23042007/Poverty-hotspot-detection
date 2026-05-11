import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, AlertTriangle, ChevronRight, Info } from 'lucide-react-native';
import { getDistricts } from '../services/api';

export default function NotificationScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getDistricts();
      const hotspots = (data.districts || []).filter(d => d.cluster_label === 'High Poverty');
      
      const mappedNotifications = hotspots.map(h => ({
        id: h.district,
        type: 'alert',
        title: 'High Poverty Detected',
        message: `${h.district} has been identified as a critical poverty hotspot with an MPI score of ${h.mpi_score.toFixed(2)}.`,
        time: 'Just now',
        data: h
      }));

      // Add a generic system notification
      mappedNotifications.unshift({
        id: 'system-1',
        type: 'info',
        title: 'System Update',
        message: 'The poverty prediction model has been updated with latest NFHS-5 data.',
        time: '2 hours ago'
      });

      setNotifications(mappedNotifications);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, item.type === 'alert' ? styles.alertBorder : styles.infoBorder]}
      onPress={() => item.data && navigation.navigate('DistrictDetail', { district: item.data })}
    >
      <View style={styles.iconContainer}>
        {item.type === 'alert' ? (
          <AlertTriangle color="#ef4444" size={24} />
        ) : (
          <Info color="#3b82f6" size={24} />
        )}
      </View>
      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.titleText}>{item.title}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
      {item.data && <ChevronRight color="#475569" size={20} />}
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell color="#334155" size={64} />
            <Text style={styles.emptyText}>No new notifications</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  center: {
    flex: 1,
    backgroundColor: '#0a1628',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#162846',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  alertBorder: {
    borderLeftColor: '#ef4444',
  },
  infoBorder: {
    borderLeftColor: '#3b82f6',
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeText: {
    color: '#64748b',
    fontSize: 12,
  },
  messageText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 16,
  },
});
