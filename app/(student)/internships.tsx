import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GraduationCap, Upload, FileText, Calendar, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';
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
  file_url: string;
  submission_status: 'submitted' | 'reviewed' | 'approved' | 'rejected';
  submitted_at: string;
  admin_feedback?: string;
  reviewed_at?: string;
}

export default function InternshipsScreen() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<InternshipSubmission[]>([]);
  const [mySubmissions, setMySubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadInternshipSubmissions();
    loadMySubmissions();
  }, [user]);

  const loadInternshipSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('internship_submissions')
        .select('*')
        .eq('is_active', true)
        .order('deadline', { ascending: true });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading internship submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMySubmissions = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('student_internship_submissions')
        .select('*')
        .eq('student_id', user.id);

      if (error) throw error;
      setMySubmissions(data || []);
    } catch (error) {
      console.error('Error loading my submissions:', error);
    }
  };

  const handleFileUpload = async (submissionId: string) => {
    if (!user?.id) return;

    // In a real app, you would implement file picker and upload to storage
    Alert.alert(
      'File Upload',
      'File upload functionality would be implemented here using expo-document-picker and file storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Simulate Upload', 
          onPress: () => simulateUpload(submissionId)
        }
      ]
    );
  };

  const simulateUpload = async (submissionId: string) => {
    if (!user?.id) return;

    try {
      setUploading(submissionId);

      // Simulate file upload with a fake URL
      const fakeFileUrl = `https://example.com/uploads/${user.id}/${submissionId}/document.pdf`;

      const { error } = await supabase
        .from('student_internship_submissions')
        .upsert({
          internship_submission_id: submissionId,
          student_id: user.id,
          file_url: fakeFileUrl,
          submission_status: 'submitted',
          submitted_at: new Date().toISOString(),
        }, { onConflict: 'internship_submission_id,student_id' });

      if (error) throw error;

      Alert.alert('Success', 'Document uploaded successfully!');
      loadMySubmissions(); // Refresh submissions
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const getMySubmission = (submissionId: string) => {
    return mySubmissions.find(sub => sub.internship_submission_id === submissionId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#34C759';
      case 'rejected': return '#FF3B30';
      case 'reviewed': return '#FF9500';
      default: return '#007AFF';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'rejected': return AlertTriangle;
      case 'reviewed': return Clock;
      default: return FileText;
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading internship submissions...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Internship Submissions</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerStatsText}>{submissions.length} Required</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {submissions.length === 0 ? (
          <View style={styles.emptyState}>
            <GraduationCap size={64} color="#6B6B6B" />
            <Text style={styles.emptyStateTitle}>No Submissions Required</Text>
            <Text style={styles.emptyStateText}>
              Check back later for internship document requirements
            </Text>
          </View>
        ) : (
          <View style={styles.submissionsList}>
            {submissions.map((submission) => {
              const mySubmission = getMySubmission(submission.id);
              const deadlinePassed = isDeadlinePassed(submission.deadline);
              const StatusIcon = mySubmission ? getStatusIcon(mySubmission.submission_status) : FileText;

              return (
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
                      <Text style={styles.submissionDescription}>{submission.description}</Text>
                    </View>
                    {mySubmission && (
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(mySubmission.submission_status) }]}>
                        <StatusIcon size={16} color="#FFFFFF" />
                        <Text style={styles.statusText}>
                          {mySubmission.submission_status.charAt(0).toUpperCase() + mySubmission.submission_status.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.submissionDetails}>
                    <View style={styles.detailItem}>
                      <Calendar size={16} color="#6B6B6B" />
                      <Text style={styles.detailText}>
                        Deadline: {formatDate(submission.deadline)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <FileText size={16} color="#6B6B6B" />
                      <Text style={styles.detailText}>
                        Type: {submission.submission_type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {mySubmission ? (
                    <View style={styles.submittedSection}>
                      <Text style={styles.submittedText}>
                        Submitted on {formatDate(mySubmission.submitted_at)}
                      </Text>
                      {mySubmission.admin_feedback && (
                        <View style={styles.feedbackSection}>
                          <Text style={styles.feedbackTitle}>Admin Feedback:</Text>
                          <Text style={styles.feedbackText}>{mySubmission.admin_feedback}</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.resubmitButton}
                        onPress={() => handleFileUpload(submission.id)}
                      >
                        <Upload size={16} color="#007AFF" />
                        <Text style={styles.resubmitText}>Update Submission</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.uploadButton,
                        (deadlinePassed || uploading === submission.id) && styles.disabledButton
                      ]}
                      onPress={() => handleFileUpload(submission.id)}
                      disabled={deadlinePassed || uploading === submission.id}
                    >
                      <Upload size={20} color="#FFFFFF" />
                      <Text style={styles.uploadButtonText}>
                        {uploading === submission.id ? 'Uploading...' : 
                         deadlinePassed ? 'Deadline Passed' : 'Upload Document'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {deadlinePassed && !mySubmission && (
                    <View style={styles.warningSection}>
                      <AlertTriangle size={16} color="#FF9500" />
                      <Text style={styles.warningText}>
                        Submission deadline has passed
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Submission Guidelines</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              • All documents must be in PDF format{'\n'}
              • File size should not exceed 10MB{'\n'}
              • Ensure documents are clearly readable{'\n'}
              • Submit before the deadline to avoid penalties{'\n'}
              • Contact admin for any submission issues
            </Text>
          </View>
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
  submissionsList: {
    gap: 20,
  },
  submissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
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
    marginBottom: 16,
  },
  submissionInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  submissionDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submissionDetails: {
    gap: 8,
    marginBottom: 16,
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
  submittedSection: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  submittedText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
    marginBottom: 12,
  },
  feedbackSection: {
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
  resubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  resubmitText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  infoSection: {
    marginTop: 24,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 22,
  },
});