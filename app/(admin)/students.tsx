import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Briefcase, Users, Eye, X, User, Trash2, CircleCheck as CheckCircle } from 'lucide-react-native';
import { Download } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface PlacementEvent {
  id: string;
  title: string;
  description: string;
  company_name: string;
  event_date: string;
  application_deadline: string;
  requirements: string;
  bucket_name?: string;
  is_active: boolean;
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
  student_id: string;
  application_status: 'pending' | 'accepted' | 'rejected';
  applied_at: string;
  admin_notes?: string;
  students: {
    name: string;
    email: string;
    uid: string;
    roll_no: string;
    student_profiles: {
      full_name: string;
      class: string;
      stream_12th: string;
    } | null;
  };
}

interface AdditionalRequirement {
  type: string;
  description: string;
  is_required: boolean;
}

export default function AdminPlacementsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<PlacementEvent[]>([]);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PlacementEvent | null>(null);
  const [creating, setCreating] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    company_name: '',
    requirements: '',
  });

  const [additionalRequirements, setAdditionalRequirements] = useState<AdditionalRequirement[]>([]);
  const [newRequirement, setNewRequirement] = useState({
    type: '',
    description: '',
    is_required: false,
  });

  useEffect(() => {
    loadPlacementEvents();
  }, []);

  const loadPlacementEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('placement_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading placement events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventApplications = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('placement_applications')
        .select(`
          *,
          students (
            name, 
            email, 
            uid, 
            roll_no,
            student_profiles (
              full_name,
              class,
              stream_12th
            )
          )
        `)
        .eq('placement_event_id', eventId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    }
  };

  const exportApplicationsToExcel = async () => {
    if (!selectedEvent || applications.length === 0) {
      Alert.alert('No Data', 'No applications to export');
      return;
    }

    try {
      const exportData = applications.map(app => ({
        'Student Name': app.students.student_profiles?.full_name || app.students.name,
        'Email': app.students.email,
        'UID': app.students.uid,
        'Roll No': app.students.roll_no,
        'Class': app.students.student_profiles?.class || 'N/A',
        'Stream (12th)': app.students.student_profiles?.stream_12th || 'N/A',
        'Application Status': app.application_status.toUpperCase(),
        'Applied Date': new Date(app.applied_at).toLocaleDateString(),
        'Admin Notes': app.admin_notes || 'None'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const fileName = `${selectedEvent.company_name}_applications_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(data, fileName);

      Alert.alert('Success', 'Applications exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export applications');
    }
  };

  const createPlacementBucket = async (bucketName: string) => {
    try {
      const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime']
      });

      if (bucketError && bucketError.message !== 'Bucket already exists') {
        console.error('Bucket creation error:', bucketError);
      }

      return true;
    } catch (error) {
      console.error('Error creating bucket:', error);
      return false;
    }
  };

  const createPlacementEvent = async () => {
    if (!newEvent.title || !newEvent.company_name) {
      Alert.alert('Error', 'Please fill in title and company name');
      return;
    }

    try {
      setCreating(true);

      const bucketName = newEvent.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-placement';

      await createPlacementBucket(bucketName);

      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        company_name: newEvent.company_name,
        event_date: new Date().toISOString(),
        application_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        requirements: newEvent.requirements,
        bucket_name: bucketName,
        is_active: true,
      };

      const { data: eventResult, error } = await supabase
        .from('placement_events')
        .insert(eventData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (additionalRequirements.length > 0) {
        const requirementsData = additionalRequirements.map(req => ({
          event_id: eventResult.id,
          type: req.type,
          description: req.description,
          is_required: req.is_required,
        }));

        const { error: reqError } = await supabase
          .from('placement_requirements')
          .insert(requirementsData);

        if (reqError) {
          console.error('Requirements creation error:', reqError);
        }
      }

      Alert.alert('Success', `Placement event created successfully! Storage bucket "${bucketName}" has been created for document uploads.`);
      
      setShowCreateModal(false);
      resetForm();
      loadPlacementEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create placement event');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: '',
      description: '',
      company_name: '',
      requirements: '',
    });
    setAdditionalRequirements([]);
    setNewRequirement({
      type: '',
      description: '',
      is_required: false,
    });
  };

  const addRequirement = () => {
    if (!newRequirement.type || !newRequirement.description) {
      Alert.alert('Error', 'Please fill in requirement type and description');
      return;
    }

    setAdditionalRequirements(prev => [...prev, { ...newRequirement }]);
    setNewRequirement({
      type: '',
      description: '',
      is_required: false,
    });
  };

  const removeRequirement = (index: number) => {
    setAdditionalRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const viewApplications = async (event: PlacementEvent) => {
    setSelectedEvent(event);
    await loadEventApplications(event.id);
    setShowApplicationsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#34C759';
      case 'rejected': return '#FF3B30';
      default: return '#FF9500';
    }
  };

  const requirementTypes = [
    'resume',
    'cover_letter',
    'portfolio',
    'transcript',
    'marksheet_10th',
    'marksheet_12th',
    'video',
    'other'
  ];

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Placement Management</Text>
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
            <Briefcase size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{events.length}</Text>
            <Text style={styles.statLabel}>Active Events</Text>
          </View>
        </View>

        <View style={styles.eventsList}>
          {events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.companyName}>{event.company_name}</Text>
              <Text style={styles.eventDescription}>{event.description}</Text>
              <Text style={styles.eventRequirements}>{event.requirements}</Text>
              {event.bucket_name && (
                <Text style={styles.bucketInfo}>Storage: {event.bucket_name}</Text>
              )}
              <Text style={styles.eventDate}>Created: {formatDate(event.created_at)}</Text>
              <View style={styles.eventActions}>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => viewApplications(event)}
                >
                  <Eye size={16} color="#007AFF" />
                  <Text style={styles.viewButtonText}>View Applications</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Create Event Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Placement Event</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Software Developer Position"
                value={newEvent.title}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Company Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., NIQ, Google, Microsoft"
                value={newEvent.company_name}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, company_name: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the position and company..."
                value={newEvent.description}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Requirements</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Minimum 70% in academics, Good communication skills..."
                value={newEvent.requirements}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, requirements: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Additional Requirements Section */}
            <View style={styles.requirementsSection}>
              <Text style={styles.sectionTitle}>Additional Document Requirements</Text>
              <Text style={styles.sectionSubtitle}>
                Add specific documents that students need to upload for this placement
              </Text>

              <View style={styles.addRequirementForm}>
                <View style={styles.requirementInputRow}>
                  <View style={styles.requirementTypeContainer}>
                    <Text style={styles.requirementLabel}>Document Type</Text>
                    <View style={styles.typeGrid}>
                      {requirementTypes.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.typeOption,
                            newRequirement.type === type && styles.selectedType
                          ]}
                          onPress={() => setNewRequirement(prev => ({ ...prev, type }))}
                        >
                          <Text style={[
                            styles.typeText,
                            newRequirement.type === type && styles.selectedTypeText
                          ]}>
                            {type.replace('_', ' ').toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.requirementLabel}>Description</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Describe what students need to submit..."
                    value={newRequirement.description}
                    onChangeText={(text) => setNewRequirement(prev => ({ ...prev, description: text }))}
                  />
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setNewRequirement(prev => ({ ...prev, is_required: !prev.is_required }))}
                  >
                    <View style={[styles.checkboxBox, newRequirement.is_required && styles.checkedBox]}>
                      {newRequirement.is_required && <CheckCircle size={16} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.checkboxLabel}>Mark as required</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.addRequirementButton}
                  onPress={addRequirement}
                >
                  <Plus size={16} color="#007AFF" />
                  <Text style={styles.addRequirementText}>Add Requirement</Text>
                </TouchableOpacity>
              </View>

              {additionalRequirements.length > 0 && (
                <View style={styles.addedRequirements}>
                  <Text style={styles.addedRequirementsTitle}>Added Requirements:</Text>
                  {additionalRequirements.map((req, index) => (
                    <View key={index} style={styles.addedRequirementItem}>
                      <View style={styles.addedRequirementInfo}>
                        <Text style={styles.addedRequirementType}>
                          {req.type.replace('_', ' ').toUpperCase()}
                          {req.is_required && <Text style={styles.requiredStar}> *</Text>}
                        </Text>
                        <Text style={styles.addedRequirementDesc}>{req.description}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeRequirementButton}
                        onPress={() => removeRequirement(index)}
                      >
                        <Trash2 size={16} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.createEventButton, creating && styles.disabledButton]}
              onPress={createPlacementEvent}
              disabled={creating}
            >
              <Text style={styles.createEventButtonText}>
                {creating ? 'Creating Event...' : 'Create Placement Event'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Applications Modal */}
      <Modal
        visible={showApplicationsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedEvent ? `${selectedEvent.company_name} - Applications` : 'Applications'}
            </Text>
            <TouchableOpacity onPress={() => setShowApplicationsModal(false)}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {applications.length > 0 && (
              <TouchableOpacity
                style={styles.exportButton}
                onPress={exportApplicationsToExcel}
              >
                <Download size={16} color="#34C759" />
                <Text style={styles.exportButtonText}>Export to Excel</Text>
              </TouchableOpacity>
            )}

            {applications.length === 0 ? (
              <View style={styles.emptyApplications}>
                <Users size={48} color="#6B6B6B" />
                <Text style={styles.emptyText}>No Applications Yet</Text>
                <Text style={styles.emptySubtext}>
                  Students haven't applied for this placement yet
                </Text>
              </View>
            ) : (
              <View style={styles.applicationsList}>
                <Text style={styles.applicationsCount}>
                  {applications.length} student{applications.length !== 1 ? 's' : ''} applied
                </Text>
                {applications.map((application) => (
                  <View key={application.id} style={styles.applicationCard}>
                    <View style={styles.applicationHeader}>
                      <View style={styles.studentInfo}>
                        <User size={20} color="#007AFF" />
                        <View style={styles.studentDetails}>
                          <Text style={styles.studentName}>
                            {application.students.student_profiles?.full_name || application.students.name}
                          </Text>
                          <Text style={styles.studentMeta}>
                            {application.students.uid} • {application.students.roll_no}
                          </Text>
                          <Text style={styles.studentEmail}>{application.students.email}</Text>
                          {application.students.student_profiles && (
                            <Text style={styles.studentClass}>
                              Class: {application.students.student_profiles.class}
                              {application.students.student_profiles.stream_12th && 
                                ` • Stream: ${application.students.student_profiles.stream_12th}`
                              }
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={[
                        styles.applicationStatus,
                        { backgroundColor: getStatusColor(application.application_status) }
                      ]}>
                        <Text style={styles.applicationStatusText}>
                          {application.application_status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.appliedDate}>
                      Applied: {formatDate(application.applied_at)}
                    </Text>
                    {application.admin_notes && (
                      <View style={styles.adminNotesSection}>
                        <Text style={styles.adminNotesTitle}>Admin Notes:</Text>
                        <Text style={styles.adminNotesText}>{application.admin_notes}</Text>
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
  eventsList: {
    gap: 16,
    paddingBottom: 40,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
    marginBottom: 8,
  },
  eventRequirements: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  bucketInfo: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 12,
    color: '#6B6B6B',
    marginBottom: 12,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  viewButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
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
  requirementsSection: {
    marginBottom: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 20,
  },
  addRequirementForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  requirementInputRow: {
    marginBottom: 16,
  },
  requirementTypeContainer: {
    marginBottom: 16,
  },
  requirementLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  typeGrid: {
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
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBox: {
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
  addRequirementButton: {
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
  addRequirementText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  addedRequirements: {
    gap: 12,
  },
  addedRequirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  addedRequirementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  addedRequirementInfo: {
    flex: 1,
  },
  addedRequirementType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  requiredStar: {
    color: '#FF3B30',
  },
  addedRequirementDesc: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  removeRequirementButton: {
    padding: 8,
  },
  createEventButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  createEventButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyApplications: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
  },
  applicationsList: {
    gap: 16,
    paddingBottom: 40,
  },
  applicationsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
    textAlign: 'center',
  },
  applicationCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  studentMeta: {
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
    color: '#6B6B6B',
    fontWeight: '500',
  },
  applicationStatus: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  applicationStatusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  appliedDate: {
    fontSize: 12,
    color: '#6B6B6B',
    marginBottom: 8,
  },
  adminNotesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  adminNotesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  adminNotesText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontStyle: 'italic',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FFF4',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#34C759',
    gap: 8,
  },
  exportButtonText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
});