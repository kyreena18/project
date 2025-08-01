import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Briefcase, Calendar, Users, Eye, Building, Clock, CircleCheck as CheckCircle, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface PlacementEvent {
  id: string;
  title: string;
  description: string;
  company_name: string;
  event_date: string;
  application_deadline: string;
  requirements: string;
  is_active: boolean;
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
  };
  student_profiles?: {
    full_name: string;
    year_of_study: string;
    department: string;
    resume_url?: string;
  };
}

export default function AdminPlacementsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<PlacementEvent[]>([]);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    company_name: '',
    event_date: '',
    application_deadline: '',
    requirements: '',
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

  const loadApplications = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('placement_applications')
        .select(`
          *,
          students (name, email, uid, roll_no),
          student_profiles (full_name, year_of_study, department, resume_url)
        `)
        .eq('placement_event_id', eventId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };
  
  const createPlacementEvent = async () => {
    if (!user?.id) return;

    const { title, company_name, event_date, application_deadline } = newEvent;

    if (!title || !company_name || !event_date || !application_deadline) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);

      // 1. Insert placement event and get inserted event data
      const { data: eventData, error } = await supabase
        .from('placement_events')
        .insert({
          ...newEvent,
          event_date: new Date(newEvent.event_date).toISOString(),
          application_deadline: new Date(newEvent.application_deadline).toISOString(),
          created_by: user.id,
          is_active: true,
        })
        .select()
        .single(); // 👈 This gives you eventData.id

      if (error) throw error;

      // 2. Insert default requirement (later this can be made dynamic)
      const { error: reqError } = await supabase
        .from('placement_requirements')
        .insert([
          {
            event_id: eventData.id,
            type: 'video', // 🔁 Replace with dynamic input later
            description: 'Submit a 2-minute video introducing yourself',
            is_required: true,
          },
          {
            event_id: eventData.id,
            type: 'portfolio',
            description: 'Upload design portfolio or work samples',
            is_required: false,
          },
        ]);

      if (reqError) throw reqError;

      // 3. Show success alert and reset form
      Alert.alert('Success', 'Placement event and requirements created!');
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        company_name: '',
        event_date: '',
        application_deadline: '',
        requirements: '',
      });
      loadPlacementEvents();
    } catch (error) {
      console.error('Supabase insert error:', error);
      Alert.alert('Error', error.message || 'Failed to create placement event');
    } finally {
      setCreating(false);
    }
  };



  const updateApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase
        .from('placement_applications')
        .update({
          application_status: status,
          admin_notes: notes,
        })
        .eq('id', applicationId);

      if (error) throw error;

      Alert.alert('Success', `Application ${status} successfully!`);
      if (selectedEventId) {
        loadApplications(selectedEventId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update application status');
    }
  };

  const viewApplications = (eventId: string) => {
    setSelectedEventId(eventId);
    loadApplications(eventId);
    setShowApplicationsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getApplicationCount = (eventId: string) => {
    return applications.filter(app => app.placement_event_id === eventId).length;
  };

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
            <Text style={styles.statLabel}>Total Events</Text>
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
                </View>
                <View style={styles.eventActions}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => viewApplications(event.id)}
                  >
                    <Eye size={16} color="#007AFF" />
                    <Text style={styles.viewButtonText}>View</Text>
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
                  <Clock size={16} color="#6B6B6B" />
                  <Text style={styles.detailText}>
                    Deadline: {formatDate(event.application_deadline)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Users size={16} color="#6B6B6B" />
                  <Text style={styles.detailText}>
                    Applications: {getApplicationCount(event.id)}
                  </Text>
                </View>
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
            <TouchableOpacity onPress={createPlacementEvent}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Software Developer Placement Drive"
                value={newEvent.title}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Company Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., NIQ (Nielsen IQ)"
                value={newEvent.company_name}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, company_name: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the placement opportunity..."
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
                placeholder="YYYY-MM-DD HH:MM"
                value={newEvent.event_date}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, event_date: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Application Deadline *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD HH:MM"
                value={newEvent.application_deadline}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, application_deadline: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Requirements</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="List the requirements for this placement..."
                value={newEvent.requirements}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, requirements: text }))}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              style={[styles.createEventButton, creating && styles.disabledButton]}
              onPress={createPlacementEvent}
              disabled={creating}
            >
              <Text style={styles.createEventButtonText}>
                {creating ? 'Creating...' : 'Create Event'}
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
            <Text style={styles.modalTitle}>Applications</Text>
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
                      <View style={styles.applicationStatus}>
                        <Text style={[
                          styles.statusText,
                          { color: application.application_status === 'accepted' ? '#34C759' : 
                                   application.application_status === 'rejected' ? '#FF3B30' : '#FF9500' }
                        ]}>
                          {application.application_status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {application.student_profiles && (
                      <View style={styles.profileInfo}>
                        <Text style={styles.profileText}>
                          {application.student_profiles.year_of_study} • {application.student_profiles.department}
                        </Text>
                        {application.student_profiles.resume_url && (
                          <Text style={styles.resumeText}>✓ Resume uploaded</Text>
                        )}
                      </View>
                    )}

                    <Text style={styles.appliedDate}>
                      Applied: {formatDate(application.applied_at)}
                    </Text>

                    {application.application_status === 'pending' && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => updateApplicationStatus(application.id, 'accepted')}
                        >
                          <CheckCircle size={16} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={() => updateApplicationStatus(application.id, 'rejected')}
                        >
                          <X size={16} color="#FFFFFF" />
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
  },
  eventActions: {
    flexDirection: 'row',
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
  eventDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDetails: {
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
  applicationStatus: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileInfo: {
    marginBottom: 8,
  },
  profileText: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 4,
  },
  resumeText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  appliedDate: {
    fontSize: 12,
    color: '#6B6B6B',
    marginBottom: 12,
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
  acceptButton: {
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