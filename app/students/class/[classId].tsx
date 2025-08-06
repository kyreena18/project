import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Search, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Student {
  id: string;
  name: string;
  uid: string;
  roll_no: string;
  student_profiles?: {
    full_name: string;
    class: string;
  };
}

export default function ClassStudentsScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClassStudents();
  }, [classId]);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery]);

  const loadClassStudents = async () => {
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
        const generateMockStudents = (classId: string): Student[] => {
          const studentCount = classId.startsWith('TY') ? 25 : 22;
          const students: Student[] = [];
          
          for (let i = 1; i <= studentCount; i++) {
            const rollNo = `${classId}${i.toString().padStart(3, '0')}`;
            students.push({
              id: `mock-${classId}-${i}`,
              name: `Student ${i}`,
              uid: rollNo,
              roll_no: rollNo,
              student_profiles: {
                full_name: `Student ${i} Full Name`,
                class: classId,
              }
            });
          }
          return students;
        };
        
        const mockStudents = generateMockStudents(classId as string);
        setStudents(mockStudents);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('student_profiles')
        .select(`
          *,
          students (
            id,
            name,
            uid,
            roll_no
          )
        `)
        .eq('class', classId)
        .order('roll_no', { ascending: true });

      if (error) throw error;

      const classStudents = (data || []).map(profile => ({
        id: profile.students?.id || profile.id,
        name: profile.students?.name || profile.full_name,
        uid: profile.students?.uid || profile.uid,
        roll_no: profile.students?.roll_no || profile.roll_no,
        student_profiles: {
          full_name: profile.full_name,
          class: profile.class,
        }
      })).sort((a, b) => a.roll_no.localeCompare(b.roll_no));

      setStudents(classStudents);
    } catch (error) {
      console.error('Error loading class students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => {
      const searchLower = searchQuery.toLowerCase();
      const fullName = student.student_profiles?.full_name || student.name;
      
      return (
        fullName.toLowerCase().includes(searchLower) ||
        student.uid.toLowerCase().includes(searchLower) ||
        student.roll_no.toLowerCase().includes(searchLower)
      );
    });

    setFilteredStudents(filtered);
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading {classId} students...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{classId} Students</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerStatsText}>{filteredStudents.length} Students</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B6B6B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, UID, roll number..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#6B6B6B"
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={64} color="#6B6B6B" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No students found' : `No ${classId} students`}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? 'Try adjusting your search criteria'
                : `No students have registered for ${classId} class yet`
              }
            </Text>
          </View>
        ) : (
          <View style={styles.studentsList}>
            {filteredStudents.map((student) => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>
                    {student.student_profiles?.full_name || student.name}
                  </Text>
                  <Text style={styles.studentDetails}>
                    Roll No: {student.roll_no}
                  </Text>
                  <Text style={styles.studentDetails}>
                    UID: {student.uid}
                  </Text>
                  <Text style={styles.studentClass}>
                    Class: {student.student_profiles?.class || 'Not Set'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerStatsText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
  },
  studentsList: {
    gap: 12,
    paddingBottom: 40,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  studentInfo: {
    gap: 4,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  studentDetails: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  studentClass: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});