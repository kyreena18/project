import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Briefcase, Calendar, Clock, Building, Users, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Upload, FileText, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';

interface PlacementEvent {
  id: string;
  title: string;
  description: string;
  company_name: string;
  event_date: string;
  application_deadline: string;
  requirements: string;
  is_active: boolean;
  bucket_name: string;
  created_at: string;
}

interface PlacementRequirement {
  id: string;
  event_id: string;
  type: string;
  description: string;
  is_required: boolean;
  created_at: string;
}

interface PlacementApplication {
  id: string;
  placement_event_id: string;
  application_status: 'pending' | 'accepted' | 'rejected';
  applied_at: string;
  admin_notes?: string;
}

interface RequirementSubmission {
  id: string;
  placement_application_id: string;
  requirement_id: string;
  file_url: string;
  submission_status: string;
  submitted_at: string;
  admin_feedback?: string;
}

export default function PlacementsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<PlacementEvent[]>([]);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [requirements, setRequirements] = useState<PlacementRequirement[]>([]);
  const [requirementSubmissions, setRequirementSubmissions] = useState<RequirementSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PlacementEvent | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    loadPlacementEvents();
    loadMyApplications();
  }, [user]);

  const loadPlacementEvents = async () => {
    try {
      // Mock data for development when Supabase is not configured
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
        // Mock placement events for development
        const mockEvents: PlacementEvent[] = [
          {
            id: '1',
            title: 'Software Developer Position',
            description: 'Join our team as a software developer working on cutting-edge projects.',
            company_name: 'TechCorp',
            event_date: '2024-03-15T00:00:00Z',
            application_deadline: '2024-03-01T00:00:00Z',
            requirements: 'Minimum 70% in academics, Good communication skills',
            is_active: true,
            bucket_name: 'techcorp-placement',
            created_at: '2024-02-01T00:00:00Z',
          },
          {
            id: '2',
            title: 'Data Analyst Role',
            description: 'Analyze data and provide insights for business decisions.',
            company_name: 'DataSoft',
            event_date: '2024-03-20T00:00:00Z',
            application_deadline: '2024-03-05T00:00:00Z',
            requirements: 'Strong analytical skills, Knowledge of SQL and Python',
            is_active: true,
            bucket_name: 'datasoft-placement',
            created_at: '2024-02-02T00:00:00Z',
          }
        ];
        setEvents(mockEvents);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('placement_events')
        .select('*')
        .eq('is_active', true)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading placement events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMyApplications = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('placement_applications')
        .select('*')
        .eq('student_id', user.id);

      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const loadEventRequirements = async (eventId: string) => {
    try {
      // Mock data for development when Supabase is not configured
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
        // Mock requirements for development
        const mockRequirements: PlacementRequirement[] = [
          {
            id: '1',
            event_id: eventId,
            type: 'video',
            description: 'Submit a 2-minute video introducing yourself and explaining why you want to join our company.',
            is_required: true,
            created_at: '2024-02-01T00:00:00Z',
          },
          {
            id: '2',
            event_id: eventId,
            type: 'portfolio',
            description: 'Upload your project portfolio showcasing your best work.',
            is_required: false,
            created_at: '2024-02-01T00:00:00Z',
          }
        ];
        setRequirements(mockRequirements);
        return;
      }

      const { data, error } = await supabase
        .from('placement_requirements')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRequirements(data || []);
    } catch (error) {
      console.error('Error loading requirements:', error);
      setRequirements([]);
    }
  };

  const loadMyRequirementSubmissions = async (applicationId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_requirement_submissions')
        .select('*')
        .eq('placement_application_id', applicationId);

      if (error) throw error;
      setRequirementSubmissions(data || []);
    } catch (error) {
      console.error('Error loading requirement submissions:', error);
    }
  };

  const checkProfileComplete = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('full_name, uid, roll_no, class')
        .eq('student_id', user.id)
        .maybeSingle();

      if (error || !data) return false;

      return !!(data.full_name && data.uid && data.roll_no && data.class);
    } catch (error) {
      console.error('Error checking profile:', error);
      return false;
    }
  };

  const applyForPlacement = async (eventId: string) => {
    if (!user?.id) {
      Alert.alert('Authentication Error', 'Please log in to apply for placements.');
      return;
    }

    // Check if profile is complete
    const profileComplete = await checkProfileComplete();
    if (!profileComplete) {
      Alert.alert(
        'Profile Incomplete',
        'Please complete your profile before applying for placements.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Profile', onPress: () => router.push('/(student)/profile') }
        ]
      );
      return;
    }

    // Load requirements first to check if there are any
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    await loadEventRequirements(eventId);

    // Check if there are additional requirements
    const { data: eventRequirements } = await supabase
      .from('placement_requirements')
      .select('*')
      .eq('event_id', eventId);

    if (eventRequirements && eventRequirements.length > 0) {
      // Show requirements modal first
      setSelectedEvent(event);
      setShowRequirementsModal(true);
      return;
    }

    // If no additional requirements, proceed with application
    await submitApplication(eventId);
  };

  const submitApplication = async (eventId: string) => {
    try {
      setApplying(eventId);

      // Create the application
      const { data: applicationData, error } = await supabase
        .from('placement_applications')
        .insert({
          placement_event_id: eventId,
          student_id: user.id,
          application_status: 'pending',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Already Applied', 'You have already applied for this placement.');
          return;
        }
        throw error;
      }

      Alert.alert('Success', 'Your application has been submitted successfully!');
      loadMyApplications();
    } catch (error: any) {
      console.error('Application submission error:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setApplying(null);
    }
  };

  const viewRequirements = async (event: PlacementEvent) => {
    const application = getApplicationStatus(event.id);
    if (!application) {
      // Allow viewing requirements even without application for preview
      setSelectedEvent(event);
      await loadEventRequirements(event.id);
      setShowRequirementsModal(true);
      return;
    }

    setSelectedEvent(event);
    await loadEventRequirements(event.id);
    await loadMyRequirementSubmissions(application.id);
    setShowRequirementsModal(true);
  };

  const uploadRequirementDocument = async (requirementId: string) => {
    if (!selectedEvent || !user?.id) return;

    const application = getApplicationStatus(selectedEvent.id);
    if (!application) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'video/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setUploading(requirementId);

      const file = result.assets[0];
      const fileUri = file.uri;
      const fileName = `${user.id}_${requirementId}_${Date.now()}.${file.name?.split('.').pop() || 'pdf'}`;

      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Use the event's bucket name for storage
      const { error: uploadError } = await supabase.storage
        .from(selectedEvent.bucket_name)
        .upload(fileName, blob, {
          contentType: file.mimeType || 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Upload Failed', 'Could not upload document.');
        return;
      }

      const { data: urlData } = supabase.storage
        .from(selectedEvent.bucket_name)
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        const { error: submissionError } = await supabase
          .from('student_requirement_submissions')
          .upsert({
            placement_application_id: application.id,
            requirement_id: requirementId,
            file_url: urlData.publicUrl,
            submission_status: 'pending',
            submitted_at: new Date().toISOString(),
          }, { onConflict: 'placement_application_id,requirement_id' });

        if (submissionError) throw submissionError;

        Alert.alert('Success', 'Document uploaded successfully!');
        loadMyRequirementSubmissions(application.id);
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const getApplicationStatus = (eventId: string) => {
    return applications.find(app => app.placement_event_id === eventId);
  };

  const getRequirementSubmission = (requirementId: string) => {
    return requirementSubmissions.find(sub => sub.requirement_id === requirementId);
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
      case 'accepted': return '#34C759';
      case 'rejected': return '#FF3B30';
      default: return '#FF9500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return CheckCircle;
      case 'rejected': return AlertCircle;
      default: return Clock;
    }
  };

  const getRequirementTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'marksheet_10th': '10th Grade Marksheet',
      'marksheet_12th': '12th Grade Marksheet',
      'video': 'Video Portfolio',
      'portfolio': 'Project Portfolio',
      'resume': 'Resume/CV',
      'cover_letter': 'Cover Letter',
      'transcript': 'Academic Transcript',
      'other': 'Other Document',
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading placement opportunities...</Text>
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
        <Text style={styles.headerTitle}>Placement Opportunities</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerStatsText}>{events.length} Available</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Briefcase size={64} color="#6B6B6B" />
            <Text style={styles.emptyStateTitle}>No Placements Available</Text>
            <Text style={styles.emptyStateText}>
              Check back later for new placement opportunities
            </Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {events.map((event) => {
              const application = getApplicationStatus(event.id);
              const deadlinePassed = isDeadlinePassed(event.application_deadline);
              const StatusIcon = application ? getStatusIcon(application.application_status) : null;

              return (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={styles.companyInfo}>
                      <Building size={32} color="#007AFF" />
                      <View style={styles.companyDetails}>
                        <Text style={styles.companyName}>{event.company_name}</Text>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                      </View>
                    </View>
                    {application && StatusIcon && (
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.application_status) }]}>
                        <StatusIcon size={16} color="#FFFFFF" />
                        <Text style={styles.statusText}>
                          {application.application_status.charAt(0).toUpperCase() + application.application_status.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.eventDescription}>{event.description}</Text>

                  <View style={styles.eventDetails}>
                    <View style={styles.detailItem}>
                      <Calendar size={16} color="#6B6B6B" />
                      <Text style={styles.detailText}>
                        Event: {formatDate(event.event_date)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Clock size={16} color="#6B6B6B" />
                      <Text style={styles.detailText}>
                        Deadline: {formatDate(event.application_deadline)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.requirementsSection}>
                    <Text style={styles.requirementsTitle}>Requirements:</Text>
                    <Text style={styles.requirementsText}>{event.requirements}</Text>
                  </View>

                  {application ? (
                    <View style={styles.appliedSection}>
                      <Text style={styles.appliedText}>
                        Applied on {formatDate(application.applied_at)}
                      </Text>
                      {application.admin_notes && (
                        <Text style={styles.adminNotes}>
                          Admin Notes: {application.admin_notes}
                        </Text>
                      )}
                      <TouchableOpacity
                        style={styles.viewRequirementsButton}
                        onPress={() => viewRequirements(event)}
                      >
                        <FileText size={16} color="#007AFF" />
                        <Text style={styles.viewRequirementsText}>View Document Requirements</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.applyButton,
                        deadlinePassed && styles.disabledButton
                      ]}
                      onPress={() => applyForPlacement(event.id)}
                      disabled={deadlinePassed}
                    >
                      <Users size={20} color="#FFFFFF" />
                      <Text style={styles.applyButtonText}>
                        {deadlinePassed ? 'Deadline Passed' : 'Apply Now'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Show requirements preview for unapplied events */}
                  {!application && (
                    <TouchableOpacity
                      style={styles.previewRequirementsButton}
                      onPress={async () => {
                        setSelectedEvent(event);
                        await loadEventRequirements(event.id);
                        setRequirements(prev => prev); // Just to trigger re-render
                        setShowRequirementsModal(true);
                      }}
                    >
                      <FileText size={16} color="#6B6B6B" />
                      <Text style={styles.previewRequirementsText}>View Document Requirements</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Requirements Modal */}
      <Modal
        visible={showRequirementsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Document Requirements</Text>
            <TouchableOpacity onPress={() => setShowRequirementsModal(false)}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedEvent && (
              <View style={styles.eventInfo}>
                <Text style={styles.eventInfoTitle}>{selectedEvent.company_name}</Text>
                <Text style={styles.eventInfoSubtitle}>{selectedEvent.title}</Text>
                <Text style={styles.bucketInfo}>Storage: {selectedEvent.bucket_name}</Text>
              </View>
            )}

            {requirements.length === 0 ? (
              <View style={styles.noRequirements}>
                <FileText size={48} color="#6B6B6B" />
                <Text style={styles.noRequirementsText}>No additional documents required</Text>
                <Text style={styles.noRequirementsSubtext}>
                  No additional document requirements have been set for this placement.
                </Text>
                {!getApplicationStatus(selectedEvent?.id || '') && (
                  <TouchableOpacity
                    style={[styles.applyFromModalButton, applying && styles.disabledButton]}
                    onPress={() => {
                      if (selectedEvent) {
                        setShowRequirementsModal(false);
                        submitApplication(selectedEvent.id);
                      }
                    }}
                    disabled={applying}
                  >
                    <Users size={20} color="#FFFFFF" />
                    <Text style={styles.applyFromModalButtonText}>
                      {applying ? 'Applying...' : 'Apply Now'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.requirementsList}>
                <Text style={styles.requirementsListTitle}>
                  {getApplicationStatus(selectedEvent?.id || '') ? 
                    'Please upload the following documents to complete your application:' :
                    'The following documents will be required for this application:'
                  }
                </Text>
                
                {!getApplicationStatus(selectedEvent?.id || '') && (
                  <View style={styles.applyFirstSection}>
                    <Text style={styles.applyFirstText}>
                      You need to apply first before uploading documents
                    </Text>
                    <TouchableOpacity
                      style={[styles.applyFromModalButton, applying && styles.disabledButton]}
                      onPress={() => {
                        if (selectedEvent) {
                          setShowRequirementsModal(false);
                          submitApplication(selectedEvent.id);
                        }
                      }}
                      disabled={applying}
                    >
                      <Users size={20} color="#FFFFFF" />
                      <Text style={styles.applyFromModalButtonText}>
                        {applying ? 'Applying...' : 'Apply Now'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {requirements.map((requirement) => {
                  const submission = getRequirementSubmission(requirement.id);
                  const isUploading = uploading === requirement.id;
                  const hasApplied = getApplicationStatus(selectedEvent?.id || '');

                  return (
                    <View key={requirement.id} style={styles.requirementCard}>
                      <View style={styles.requirementHeader}>
                        <View style={styles.requirementInfo}>
                          <Text style={styles.requirementTitle}>
                            {getRequirementTypeLabel(requirement.type)}
                            {requirement.is_required && (
                              <Text style={styles.requiredIndicator}> *</Text>
                            )}
                          </Text>
                          <Text style={styles.requirementDescription}>
                            {requirement.description}
                          </Text>
                        </View>
                        {submission && (
                          <View style={[
                            styles.submissionStatus,
                            { backgroundColor: submission.submission_status === 'approved' ? '#34C759' : '#FF9500' }
                          ]}>
                            <Text style={styles.submissionStatusText}>
                              {submission.submission_status.charAt(0).toUpperCase() + submission.submission_status.slice(1)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {submission ? (
                        <View style={styles.submittedInfo}>
                          <Text style={styles.submittedText}>
                            ✓ Submitted on {formatDate(submission.submitted_at)}
                          </Text>
                          {submission.admin_feedback && (
                            <Text style={styles.feedbackText}>
                              Feedback: {submission.admin_feedback}
                            </Text>
                          )}
                          {getApplicationStatus(selectedEvent?.id || '') && (
                            <TouchableOpacity
                              style={styles.reuploadButton}
                              onPress={() => uploadRequirementDocument(requirement.id)}
                              disabled={isUploading}
                            >
                              <Upload size={16} color="#007AFF" />
                              <Text style={styles.reuploadText}>
                                {isUploading ? 'Uploading...' : 'Update Document'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : (
                        hasApplied ? (
                          <TouchableOpacity
                            style={[styles.uploadButton, isUploading && styles.disabledButton]}
                            onPress={() => uploadRequirementDocument(requirement.id)}
                            disabled={isUploading}
                          >
                            <Upload size={16} color="#FFFFFF" />
                            <Text style={styles.uploadButtonText}>
                              {isUploading ? 'Uploading...' : 'Upload Document'}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.previewOnlyInfo}>
                            <Text style={styles.previewOnlyText}>
                              Apply first to upload this document
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Upload Guidelines</Text>
              <Text style={styles.infoText}>
                • Accepted formats: PDF, JPG, PNG, MP4 (for videos){'\n'}
                • Maximum file size: 50MB{'\n'}
                • Ensure documents are clear and readable{'\n'}
                • Required documents must be uploaded{'\n'}
                • Files are stored in company-specific secure storage{'\n'}
                • Contact admin for any upload issues
              </Text>
            </View>
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
  eventsList: {
    gap: 20,
    paddingBottom: 40,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyDetails: {
    marginLeft: 12,
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    color: '#6B6B6B',
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
  eventDescription: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDetails: {
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
  requirementsSection: {
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  requirementsText: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
  },
  appliedSection: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  appliedText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
    marginBottom: 8,
  },
  adminNotes: {
    fontSize: 14,
    color: '#6B6B6B',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  viewRequirementsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  viewRequirementsText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  applyButton: {
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
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  eventInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  eventInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  eventInfoSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 4,
  },
  bucketInfo: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  loadingRequirements: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noRequirements: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noRequirementsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noRequirementsSubtext: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 20,
  },
  requirementsList: {
    gap: 16,
  },
  requirementsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
    textAlign: 'center',
  },
  requirementCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requirementInfo: {
    flex: 1,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  requiredIndicator: {
    color: '#FF3B30',
  },
  requirementDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
  },
  submissionStatus: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  submissionStatusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submittedInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  submittedText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  reuploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  reuploadText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
  },
  previewRequirementsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  previewRequirementsText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  previewOnlyInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  previewOnlyText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontStyle: 'italic',
  },
  applyToUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  applyToUploadText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  applySection: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  applySectionText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  applyFromModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    marginTop: 16,
  },
  applyFromModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});