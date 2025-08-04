import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, GraduationCap, FileText, Calendar, Users, Eye, X, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface InternshipSubmission {
  id: string;
  title: string;
  description: string;
  submission_type: string;
  is_required: boolean;
  deadline: string;
  is_active: boolean;
  created_at: string;
}

interface StudentSubmission {
  id: string;
  internship_submission_id: string;
  student_id: string;
  file_url: string;
  submission_status: 'submitted' | 'reviewed' | 'approved' | 'rejected';
  submitted_at: string;
  admin_feedback?: string;
  reviewed_at?: string;
  students: {
    name: string;
    email: string;
    uid: string;
    roll_no: string;
  };
  student_profiles?: {
    full_name: string;
    class: string;
  };
}

export default function AdminInternshipsScreen() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<InternshipSubmission[]>([]);
  const [studentSubmissions, setStudentSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [newSubmission, setNewSubmission] = useState({
    title: '',
    description: '',
    submission_type: '',
    is_required: false,
    deadline: '',
  });

  useEffect(() => {
    loadInternshipSubmissions();
  }, []);

  const loadInternshipSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('internship_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading internship submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentSubmissions = async (submissionId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_internship_submissions')
        .select(`
          *,
          students (name, email, uid, roll_no),
          student_profiles (full_name, class, stream_12th)
        `)
        .eq('internship_submission_id', submissionId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setStudentSubmissions(data || []);
    } catch (error) {
      console.error('Error loading student submissions:', error);
    }
  };

  const createInternshipSubmission = async () => {
    if (!user?.id) return;

    if (!newSubmission.title || !newSubmission.submission_type || !newSubmission.deadline) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);

      const { error } = await supabase
        .from('internship_submissions')
        .insert({
          ...newSubmission,
          created_by: user.id,
          is_active: true,
        });

      if (error) throw error;

      Alert.alert('Success', 'Internship submission requirement created successfully!');
      setShowCreateModal(false);
      setNewSubmission({
        title: '',
        description: '',
        submission_type: '',
        is_required: false,
        deadline: '',
      });
      loadInternshipSubmissions();
    } catch (error) {
      Alert.alert('Error', 'Failed to create internship submission requirement');
    } finally {
      setCreating(false);
    }
  };

  const updateSubmissionStatus = async (submissionId: string, status: 'approved' | 'rejected', feedback?: string) => {
    try {
      const { error } = await supabase
        .from('student_internship_submissions')
        .update({
          submission_status: status,
          admin_feedback: feedback,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;

      Alert.alert('Success', `Submission ${status} successfully!`);
      if (selectedSubmissionId) {
        loadStudentSubmissions(selectedSubmissionId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update submission status');
    }
  };

  const viewSubmissions = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    loadStudentSubmissions(submissionId);
    setShowSubmissionsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSubmissionCount = (submissionId: string) => {
    return studentSubmissions.filter(sub => sub.internship_submission_id === submissionId).length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#34C759';
      case 'rejected': return '#FF3B30';
      case 'reviewed': return '#FF9500';
      default: return '#007AFF';
    }
  };

  const submissionTypes = [
    'offer_letter',
    'weekly_report',
    'completion_certificate',
    'evaluation_form',
    'project_report',
    'attendance_sheet',
  ];

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Internship Management</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <GraduationCap size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{submissions.length}</Text>
            <Text style={styles.statLabel}>Requirements</Text>
          </View>
          <View style={styles.statCard}>
            <FileText size={24} color="#34C759" />
            <Text style={styles.statNumber}>{studentSubmissions.length}</Text>
            <Text style={styles.statLabel}>Submissions</Text>
          </View>
        </View>

        <View style={styles.submissionsList}>
          {submissions.map((submission) => (
            <View key={submission.id} style={styles.submissionCard}>
              <View style={styles.submissionHeader}>
                <View style={styles.submissionInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.submissionTitle}>{submission.title}</Text>
                    {submission.is_required && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Required</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.submissionType}>
                    Type: {submission.submission_type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => viewSubmissions(submission.id)}
                >
                  <Eye size={16} color="#007AFF" />
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.submissionDescription}>{submission.description}</Text>

              <View style={styles.submissionDetails}>
                <View style={styles.detailItem}>
                  <Calendar size={16} color="#6B6B6B" />
                  <Text style={styles.detailText}>
                    Deadline: {formatDate(submission.deadline)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Users size={16} color="#6B6B6B" />
                  <Text style={styles.detailText}>
                    Submissions: {getSubmissionCount(submission.id)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Create Submission Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Submission Requirement</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Internship Offer Letter"
                value={newSubmission.title}
                onChangeText={(text) => setNewSubmission(prev => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what students need to submit..."
                value={newSubmission.description}
                onChangeText={(text) => setNewSubmission(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Submission Type *</Text>
              <View style={styles.typeContainer}>
                {submissionTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      newSubmission.submission_type === type && styles.selectedType
                    ]}
                    onPress={() => setNewSubmission(prev => ({ ...prev, submission_type: type }))}
                  >
                    <Text style={[
                      styles.typeText,
                      newSubmission.submission_type === type && styles.selectedTypeText
                    ]}>
                      {type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Deadline *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={newSubmission.deadline}
                onChangeText={(text) => setNewSubmission(prev => ({ ...prev, deadline: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setNewSubmission(prev => ({ ...prev, is_required: !prev.is_required }))}
              >
                <View style={[styles.checkbox, newSubmission.is_required && styles.checkedBox]}>
                  {newSubmission.is_required && <CheckCircle size={16} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Mark as required</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.createSubmissionButton, creating && styles.disabledButton]}
              onPress={createInternshipSubmission}
              disabled={creating}
            >
              <Text style={styles.createSubmissionButtonText}>
                {creating ? 'Creating...' : 'Create Requirement'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Student Submissions Modal */}
      <Modal
        visible={showSubmissionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Student Submissions</Text>
            <TouchableOpacity onPress={() => setShowSubmissionsModal(false)}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {studentSubmissions.length === 0 ? (
              <View style={styles.emptySubmissions}>
                <FileText size={48} color="#6B6B6B" />
                <Text style={styles.emptyText}>No submissions yet</Text>
              </View>
            ) : (
              <View style={styles.studentSubmissionsList}>
                {studentSubmissions.map((submission) => (
                  <View key={submission.id} style={styles.studentSubmissionCard}>
                    <View style={styles.studentSubmissionHeader}>
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>
                          {submission.student_profiles?.full_name || submission.students.name}
                        </Text>
                        <Text style={styles.studentDetails}>
                          {submission.students.uid} • {submission.students.roll_no}
                        </Text>
                        <Text style={styles.studentEmail}>{submission.students.email}</Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(submission.submission_status) }
                      ]}>
                        <Text style={styles.statusText}>
                          {submission.submission_status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {submission.student_profiles && (
                      <View style={styles.profileInfo}>
                        <Text style={styles.profileText}>
                          Class: {submission.student_profiles.class}
                          {submission.student_profiles.stream_12th && 
                            ` • Stream: ${submission.student_profiles.stream_12th}`
                          }
                        </Text>
                      </View>
                    )}

                    <Text style={styles.submittedDate}>
                      Submitted: {formatDate(submission.submitted_at)}
                    </Text>

                    <TouchableOpacity style={styles.fileButton}>
                      <FileText size={16} color="#007AFF" />
                      <Text style={styles.fileButtonText}>View Document</Text>
                    </TouchableOpacity>

                    {submission.admin_feedback && (
                      <View style={styles.feedbackSection}>
                        <Text style={styles.feedbackTitle}>Admin Feedback:</Text>
                        <Text style={styles.feedbackText}>{submission.admin_feedback}</Text>
                      </View>
                    )}

                    {submission.submission_status === 'submitted' && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.approveButton]}
                          onPress={() => updateSubmissionStatus(submission.id, 'approved', 'Submission approved')}
                        >
                          <CheckCircle size={16} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={() => updateSubmissionStatus(submission.id, 'rejected', 'Please resubmit with corrections')}
                        >
                          <AlertTriangle size={16} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'center',
  },
  submissionsList: {
    gap: 16,
    paddingBottom: 40,
  },
  submissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  submissionInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  submissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  requiredText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submissionType: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
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
  submissionDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
    marginBottom: 16,
  },
  submissionDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B6B6B',
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeText: {
    fontSize: 12,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  selectedTypeText: {
    color: '#FFFFFF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  createSubmissionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  createSubmissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptySubmissions: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B6B6B',
    marginTop: 16,
  },
  studentSubmissionsList: {
    gap: 16,
    paddingBottom: 40,
  },
  studentSubmissionCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  studentSubmissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
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
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileInfo: {
    marginBottom: 8,
  },
  profileText: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  submittedDate: {
    fontSize: 12,
    color: '#6B6B6B',
    marginBottom: 12,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 12,
  },
  fileButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  feedbackSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});