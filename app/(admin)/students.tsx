import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Plus, Filter, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function StudentsScreen() {
  const router = useRouter();
  const [classCounts, setClassCounts] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassCounts();
  }, []);

  const loadClassCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('class');

      if (error) throw error;

      const counts: { [key: string]: number } = {};
      classButtons.forEach(classId => {
        counts[classId] = (data || []).filter(profile => profile.class === classId).length;
      });

      setClassCounts(counts);
    } catch (error) {
      console.error('Error loading class counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassPress = (classId: string) => {
    router.push(`/students/class/${classId}`);
  };

  const classButtons = ['TYIT', 'TYSD', 'SYIT', 'SYSD'];

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Management</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B6B6B" />
          <Text style={styles.searchPlaceholder}>Search students...</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.studentsList}>
          {classButtons.map((classId) => (
            <TouchableOpacity
              key={classId}
              style={styles.studentCard}
              onPress={() => handleClassPress(classId)}
            >
              <View style={styles.classIcon}>
                <Users size={32} color="#007AFF" />
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.className}>{classId}</Text>
                <Text style={styles.classDescription}>
                  {loading ? 'Loading...' : `${classCounts[classId] || 0} students enrolled`}
                </Text>
                <Text style={styles.classSubtext}>Tap to view all students</Text>
              </View>
              <View style={styles.studentActions}>
                <View style={styles.studentCount}>
                  <Text style={styles.studentCountText}>
                    {loading ? '...' : classCounts[classId] || 0}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchPlaceholder: {
    color: '#6B6B6B',
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  studentsList: {
    gap: 16,
    paddingBottom: 40,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  classIcon: {
    marginRight: 16,
  },
  studentInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  classDescription: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  classSubtext: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  studentActions: {
    alignItems: 'center',
  },
  studentCount: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  studentCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
