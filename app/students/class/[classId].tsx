import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Search, User, Mail, Hash, FileText, Eye, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Student {
  id: string;
  name: string;
  uid: string;
  email: string;
  roll_no: string;
  department: string;
  year: string;
  gpa: number;
  total_credits: number;
  created_at: string;
  student_profiles?: {
    full_name: string;
    class: string;
    stream_12th: string;
    resume_url?: string;
    marksheet_10th_url?: string;
    marksheet_12th_url?: string;
  };
}

export default function ClassStudentsScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadClassStudents();
  }, [classId]);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery]);

  const loadClassStudents = async () => {
    try {
      // Mock data for development when Supabase is not configured
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
        // Mock students data for development
        const mockStudents: Student[] = [
          {
            id: '1',
            name: 'John Doe',
            uid: 'TYIT001',
            email: 'john@college.edu',
            roll_no: 'TYIT001',
            department: 'Computer Science',
            year: '3rd Year',
            gpa: 8.5,
            total_credits: 120,
            created_at: '2024-01-15T00:00:00Z',
            student_profiles: {
              full_name: 'John Doe',
              class: classId as string,
              stream_12th: 'Science',
              resume_url: 'https://example.com/resume1.pdf',
              marksheet_10th_url: 'https://example.com/10th1.pdf',
              marksheet_12th_url: 'https://example.com/12th1.pdf',
            }
          },
          {
            id: '2',
            name: 'Jane Smith',
            uid: 'TYIT002',
            email: 'jane@college.edu',
            roll_no: 'TYIT002',
            department: 'Computer Science',
            year: '3rd Year',
            gpa: 9.2,
            total_credits: 125,
            created_at: '2024-01-16T00:00:00Z',
            student_profiles: {
              full_name: 'Jane Smith',
              class: classId as string,
              stream_12th: 'Science',
              resume_url: 'https://example.com/resume2.pdf',
              marksheet_10th_url: '',
              marksheet_12th_url: 'https://example.com/12th2.pdf',
            }
          }
        ];
        
        // Filter by class and sort by roll number
        const filteredStudents = mockStudents
          .filter(student => student.student_profiles?.class === classId)
          .sort((a, b) => a.roll_no.localeCompare(b.roll_no));
        
        setStudents(filteredStudents);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          student_profiles (
            full_name,
            class,
            stream_12th,
            resume_url,
            marksheet_10th_url,
            marksheet_12th_url
          )
        `)
        .order('roll_no', { ascending: true });

      if (error) throw error;

      // Filter students by class from their profile
      const classStudents = (data || []).filter(student => 
        student.student_profiles?.class === classId
      ).sort((a, b) => a.roll_no.localeCompare(b.roll_no));

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
        student.roll_no.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower)
      );
    });

    setFilteredStudents(filtered);
  };

  const viewStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
                <View style={styles.studentHeader}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>
                      {student.student_profiles?.full_name || student.name}
                    </Text>
                    <Text style={styles.studentDetails}>
                      {student.uid} • {student.roll_no}
                    </Text>
                    <Text style={styles.studentEmail}>{student.email}</Text>
                    {student.student_profiles && (
                      <Text style={styles.studentClass}>
                        {student.student_profiles.class} • {student.student_profiles.stream_12th}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => viewStudentDetails(student)}
                  >
                    <Eye size={16} color="#007AFF" />
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.studentStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>GPA</Text>
                    <Text style={styles.statValue}>{student.gpa.toFixed(2)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Credits</Text>
                    <Text style={styles.statValue}>{student.total_credits}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Joined</Text>
                    <Text style={styles.statValue}>{formatDate(student.created_at)}</Text>
                  </View>
                </View>

                {student.student_profiles && (
                  <View style={styles.documentsSection}>
                    <Text style={styles.documentsTitle}>Documents:</Text>
                    <View style={styles.documentsList}>
                      <View style={[
                        styles.documentItem,
                        student.student_profiles.resume_url && styles.documentUploaded
                      ]}>
                        <Text style={styles.documentText}>Resume</Text>
                        <Text style={styles.documentStatus}>
                          {student.student_profiles.resume_url ? '✓' : '✗'}
                        </Text>
                      </View>
                      <View style={[
                        styles.documentItem,
                        student.student_profiles.marksheet_10th_url && styles.documentUploaded
                      ]}>
                        <Text style={styles.documentText}>10th Marksheet</Text>
                        <Text style={styles.documentStatus}>
                          {student.student_profiles.marksheet_10th_url ? '✓' : '✗'}
                        </Text>
                      </View>
                      <View style={[
                        styles.documentItem,
                        student.student_profiles.marksheet_12th_url && styles.documentUploaded
                      ]}>
                        <Text style={styles.documentText}>12th Marksheet</Text>
                        <Text style={styles.documentStatus}>
                          {student.student_profiles.marksheet_12th_url ? '✓' : '✗'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Student Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Student Details</Text>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          {selectedStudent && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailsCard}>
                <View style={styles.detailsHeader}>
                  <View style={styles.detailsAvatar}>
                    <Text style={styles.detailsAvatarText}>
                      {(() => {
                        const name = selectedStudent.student_profiles?.full_name || selectedStudent.name;
                        return name.split(' ').map(n => n[0]).join('').toUpperCase();
                      })()}
                    </Text>
                  </View>
                  <View style={styles.detailsInfo}>
                    <Text style={styles.detailsName}>
                      {selectedStudent.student_profiles?.full_name || selectedStudent.name}
                    </Text>
                    <Text style={styles.detailsSubtitle}>
                      {selectedStudent.uid} • {selectedStudent.roll_no}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Contact Information</Text>
                  <View style={styles.detailsItem}>
                    <Mail size={16} color="#6B6B6B" />
                    <Text style={styles.detailsItemText}>{selectedStudent.email}</Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Academic Information</Text>
                  <View style={styles.detailsItem}>
                    <Hash size={16} color="#6B6B6B" />
                    <Text style={styles.detailsItemText}>UID: {selectedStudent.uid}</Text>
                  </View>
                  <View style={styles.detailsItem}>
                    <FileText size={16} color="#6B6B6B" />
                    <Text style={styles.detailsItemText}>Roll No: {selectedStudent.roll_no}</Text>
                  </View>
                  {selectedStudent.student_profiles && (
                    <>
                      <View style={styles.detailsItem}>
                        <User size={16} color="#6B6B6B" />
                        <Text style={styles.detailsItemText}>Class: {selectedStudent.student_profiles.class}</Text>
                      </View>
                      <View style={styles.detailsItem}>
                        <User size={16} color="#6B6B6B" />
                        <Text style={styles.detailsItemText}>12th Stream: {selectedStudent.student_profiles.stream_12th}</Text>
                      </View>
                    </>
                  )}
                  <View style={styles.detailsItem}>
                    <Text style={styles.detailsItemText}>Department: {selectedStudent.department}</Text>
                  </View>
                  <View style={styles.detailsItem}>
                    <Text style={styles.detailsItemText}>Year: {selectedStudent.year}</Text>
                  </View>
                  <View style={styles.detailsItem}>
                    <Text style={styles.detailsItemText}>GPA: {selectedStudent.gpa.toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailsItem}>
                    <Text style={styles.detailsItemText}>Total Credits: {selectedStudent.total_credits}</Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Registration</Text>
                  <View style={styles.detailsItem}>
                    <Text style={styles.detailsItemText}>
                      Joined: {formatDate(selectedStudent.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
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
    gap: 16,
    paddingBottom: 40,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  studentClass: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  studentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B6B6B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  documentsSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  documentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  documentsList: {
    gap: 8,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  documentUploaded: {
    borderColor: '#34C759',
    backgroundColor: '#F0FFF4',
  },
  documentText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  documentStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  detailsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailsAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailsAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detailsInfo: {
    flex: 1,
  },
  detailsName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  detailsSubtitle: {
    fontSize: 16,
    color: '#6B6B6B',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  detailsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 12,
  },
  detailsItemText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
});