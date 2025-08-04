import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Briefcase, Calendar, Users, Eye, X, Building, FileText, Trash2, Download } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { utils, write } from 'xlsx';

interface PlacementEvent {
  id: string;
  title: string;
  description: string;
  company_name: string;
  event_date: string;
  application_deadline: string;
  requirements: string;
  bucket_name: string;
  is_active: boolean;
  created_at: string;
}

interface PlacementRequirement {
  id: string;
  event_id: string;
  type: string;
  description: string;
  is_required: boolean;
}

interface PlacementApplication {
  id: string;
  placement_event_id: string;
  student_id: string;
  application_status: string;
  applied_at: string;
  admin_notes: string;
  students: {
    name: string;
    email: string;
    uid: string;
    roll_no: string;
  };
  student_profiles?: {
    full_name: string;
    class: string;
    resume_url: string;
  };
}

export default function AdminPlacementsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<PlacementEvent[]>([]);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [requirements, setRequirements] = useState<PlacementRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PlacementEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    company_name: '',
    event_date: '',
    application_deadline: '',
    requirements: '',
  });

  const [newRequirements, setNewRequirements] = useState<Array<{
    type: string;
    description: string;
    is_required: boolean;
  }>>([]);

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
      Alert.alert('Error', 'Failed to load placement events');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('placement_applications')
        .select(`
          *,
          students (name, email, uid, roll_no),
          student_profiles (full_name, class, resume_url)
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

  const createCompanyBucket = async (companyName: string): Promise<string> => {
    try {
      const bucketName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-placement';
      
      // Try to create bucket by inserting directly into storage.buckets table
      const { error: bucketError } = await supabase
        .from('storage.buckets')
        .insert({
          id: bucketName,
          name: bucketName,
          public: true,
          file_size_limit: 52428800, // 50MB
          allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime']
        });

      if (bucketError) {
        // Check if bucket already exists
        if (bucketError.code === '23505') {
          console.log('Bucket already exists:', bucketName);
          return bucketName;
        }
        console.error('Bucket creation error:', bucketError);
        throw new Error('Failed to create storage bucket: ' + bucketError.message);
      }

      console.log('Successfully created bucket:', bucketName);
      return bucketName;
    } catch (error) {
      console.error('Error creating company bucket:', error);
      console.log('Using fallback bucket: student-documents');
      return 'student-documents'; // Fallback to existing bucket
    }
  };

  const createPlacementEvent = async () => {
    if (!user?.id) return;

    if (!newEvent.title || !newEvent.company_name || !newEvent.event_date || !newEvent.application_deadline) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);

      // Create company-specific bucket
      let bucketName;
      try {
        bucketName = await createCompanyBucket(newEvent.company_name);
      } catch (error) {
        console.log('Bucket creation failed:', error);
        bucketName = 'student-documents'; // Use fallback
      }

      // Create the placement event
      const { data: eventData, error: eventError } = await supabase
        .from('placement_events')
        .insert({
          ...newEvent,
          bucket_name: bucketName,
          created_by: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create additional requirements
      if (newRequirements.length > 0) {
        const requirementsData = newRequirements.map(req => ({
          event_id: eventData.id,
          type: req.type,
          description: req.description,
          is_required: req.is_required,
        }));

        const { error: reqError } = await supabase
          .from('placement_requirements')
          .insert(requirementsData);

        if (reqError) throw reqError;
      }

      Alert.alert('Success', 'Placement event created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadPlacementEvents();
    } catch (error) {
      console.error('Event creation error:', error);
      Alert.alert('Error', 'Failed to create placement event');
    } finally {
      setCreating(false);
    }
  };

  const viewApplications = async (event: PlacementEvent) => {
    setSelectedEvent(event);
    await loadApplications(event.id);
    setShowApplicationsModal(true);
  };

  const exportApplications = async (event: PlacementEvent) => {
    try {
      setExporting(true);

      // Load applications with full data
      const { data: applicationsData, error } = await supabase
        .from('placement_applications')
        .select(`
          *,
          students (name, email, uid, roll_no),
          student_profiles (full_name, class, resume_url)
        `)
        .eq('placement_event_id', event.id);

      if (error) throw error;

      // Load requirements for this event
      const { data: requirementsData } = await supabase
        .from('placement_requirements')
        .select('*')
        .eq('event_id', event.id);

      // Load requirement submissions
      const { data: submissionsData } = await supabase
        .from('student_requirement_submissions')
        .select('*')
        .in('placement_application_id', applicationsData?.map(app => app.id) || []);

      // Prepare Excel data
      const excelData = applicationsData?.map(app => {
        const profile = app.student_profiles;
        const student = app.students;
        
        const row: any = {
          'Student Name': profile?.full_name || student.name,
          'UID': student.uid,
          'Roll Number': student.roll_no,
          'Email': student.email,
          'Class': profile?.class || 'N/A',
          'Application Status': app.application_status,
          'Applied Date': new Date(app.applied_at).toLocaleDateString(),
          'Resume URL': profile?.resume_url || 'Not uploaded',
          'Admin Notes': app.admin_notes || 'None',
        };

        // Add requirement submissions
        requirementsData?.forEach(req => {
          const submission = submissionsData?.find(sub => 
            sub.placement_application_id === app.id && sub.requirement_id === req.id
          );
          row[`${req.type} (${req.is_required ? 'Required' : 'Optional'})`] = 
            submission ? submission.file_url : 'Not submitted';
          row[`${req.type} Status`] = submission?.submission_status || 'Not submitted';
          row[`${req.type} Feedback`] = submission?.admin_feedback || 'None';
        });

        return row;
      }) || [];

      // Create Excel workbook
      const ws = utils.json_to_sheet(excelData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Applications');

      // Generate Excel file
      const wbout = write(wb, { type: 'base64', bookType: 'xlsx' });
      const fileName = `${event.company_name}_placement_applications_${new Date().toISOString().split('T')[0]}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Placement Applications',
      });

      Alert.alert('Success', 'Applications exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export applications');
    } finally {
      setExporting(false);
    }
  };

  const addRequirement = () => {
    setNewRequirements([...newRequirements, {
      type: '',
      description: '',
      is_required: true,
    }]);
  };

  const updateRequirement = (index: number, field: string, value: any) => {
    const updated = [...newRequirements];
    updated[index] = { ...updated[index], [field]: value };
    setNewRequirements(updated);
  };

  const removeRequirement = (index: number) => {
    setNewRequirements(newRequirements.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setNewEvent({
      title: '',
      description: '',
      company_name: '',
      event_date: '',
      application_deadline: '',
      requirements: '',
    });
    setNewRequirements([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const requirementTypes = [
    'video',
    'portfolio',
    'cover_letter',
    'transcript',
    'marksheet_10th',
    'marksheet_12th',
    'other',
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
          <View style={styles.statCard}>
            <Users size={24} color="#34C759" />
            <Text style={styles.statNumber}>{applications.length}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
        </View>

        <View style={styles.eventsList}>
          {events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.companyName}>{event.company_name}</Text>
                  <Text style={styles.bucketInfo}>Bucket: {event.bucket_name}</Text>
                </View>
                <View style={styles.eventActions}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => viewApplications(event)}
                  >
                    <Eye size={16} color="#007AFF" />
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.exportButton}
                    onPress={() => exportApplications(event)}
                    disabled={exporting}
                  >
                    <Download size={16} color="#34C759" />
                    <Text style={styles.exportButtonText}>
                      {exporting ? 'Exporting...' : 'Export'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
                  <Calendar size={16} color="#6B6B6B" />
                  <Text style={styles.detailText}>
                    Deadline: {formatDate(event.application_deadline)}
                  </Text>
                </View>
              </View>

              <View style={styles.requirementsSection}>
                <Text style={styles.requirementsTitle}>Requirements:</Text>
                <Text style={styles.requirementsText}>{event.requirements}</Text>
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
              <Text style={styles.label}>Event Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={newEvent.event_date}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, event_date: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Application Deadline *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={newEvent.application_deadline}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, application_deadline: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Basic Requirements</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Minimum 70% in academics, Good communication skills..."
                value={newEvent.requirements}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, requirements: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.requirementsHeader}>
                <Text style={styles.label}>Additional Document Requirements</Text>
                <TouchableOpacity style={styles.addRequirementButton} onPress={addRequirement}>
                  <Plus size={16} color="#007AFF" />
                  <Text style={styles.addRequirementText}>Add Requirement</Text>
                </TouchableOpacity>
              </View>

              {newRequirements.map((requirement, index) => (
                <View key={index} style={styles.requirementItem}>
                  <View style={styles.requirementHeader}>
                    <Text style={styles.requirementLabel}>Requirement {index + 1}</Text>
                    <TouchableOpacity onPress={() => removeRequirement(index)}>
                      <Trash2 size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.requirementForm}>
                    <Text style={styles.subLabel}>Type</Text>
                    <View style={styles.typeContainer}>
                      {requirementTypes.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.typeOption,
                            requirement.type === type && styles.selectedType
                          ]}
                          onPress={() => updateRequirement(index, 'type', type)}
                        >
                          <Text style={[
                            styles.typeText,
                            requirement.type === type && styles.selectedTypeText
                          ]}>
                            {type.replace('_', ' ').toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.subLabel}>Description</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Describe what students need to submit..."
                      value={requirement.description}
                      onChangeText={(text) => updateRequirement(index, 'description', text)}
                    />

                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => updateRequirement(index, 'is_required', !requirement.is_required)}
                    >
                      <View style={[styles.checkbox, requirement.is_required && styles.checkedBox]}>
                        {requirement.is_required && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxLabel}>Required</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
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
              {selectedEvent?.company_name} Applications
            </Text>
            <TouchableOpacity onPress={() => setShowApplicationsModal(false)}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {applications.length === 0 ? (
              <View style={styles.emptyApplications}>
                <Users size={48} color="#6B6B6B" />
                <Text style={styles.emptyText}>No applications yet</Text>
              </View>
            ) : (
              <View style={styles.applicationsList}>
                {applications.map((application) => (
                  <View key={application.id} style={styles.applicationCard}>
                    <View style={styles.applicationHeader}>
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>
                          {application.student_profiles?.full_name || application.students.name}
                        </Text>
                        <Text style={styles.studentDetails}>
                          {application.students.uid} • {application.students.roll_no}
                        </Text>
                        <Text style={styles.studentEmail}>{application.students.email}</Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: application.application_status === 'accepted' ? '#34C759' : 
                                          application.application_status === 'rejected' ? '#FF3B30' : '#FF9500' }
                      ]}>
                        <Text style={styles.statusText}>
                          {application.application_status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {application.student_profiles && (
                      <View style={styles.profileInfo}>
                        <Text style={styles.profileText}>
                          Class: {application.student_profiles.class}
                        </Text>
                        {application.student_profiles.resume_url && (
                          <TouchableOpacity style={styles.resumeButton}>
                            <FileText size={16} color="#007AFF" />
                            <Text style={styles.resumeButtonText}>View Resume</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    <Text style={styles.appliedDate}>
                      Applied: {formatDate(application.applied_at)}
                    </Text>

                    {application.admin_notes && (
                      <View style={styles.notesSection}>
                        <Text style={styles.notesTitle}>Admin Notes:</Text>
                        <Text style={styles.notesText}>{application.admin_notes}</Text>
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
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
    marginBottom: 2,
  },
  bucketInfo: {
    fontSize: 12,
    color: '#6B6B6B',
    fontStyle: 'italic',
  },
  eventActions: {
    gap: 8,
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  exportButtonText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventDetails: {
    gap: 8,
    marginBottom: 12,
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
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  requirementsText: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 18,
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
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
    marginTop: 12,
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
  requirementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addRequirementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  addRequirementText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  requirementItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  requirementForm: {
    gap: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  typeOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
    gap: 8,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1C1C1E',
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
    fontSize: 16,
    color: '#6B6B6B',
    marginTop: 16,
  },
  applicationsList: {
    gap: 16,
    paddingBottom: 40,
  },
  applicationCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  applicationHeader: {
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
    marginBottom: 8,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  resumeButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  appliedDate: {
    fontSize: 12,
    color: '#6B6B6B',
    marginBottom: 8,
  },
  notesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontStyle: 'italic',
  },
});