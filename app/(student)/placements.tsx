import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Briefcase, Calendar, Building, Users } from 'lucide-react-native';
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
  eligible_classes: string[];
  is_active: boolean;
  created_at: string;
}

interface PlacementApplication {
  id: string;
  placement_event_id: string;
  application_status: 'pending' | 'applied' | 'accepted' | 'rejected';
  applied_at: string;
  admin_notes?: string;
}

export default function PlacementsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<PlacementEvent[]>([]);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [studentClass, setStudentClass] = useState<string>('');

  useEffect(() => {
    loadStudentClass();
    loadPlacementEvents();
    loadMyApplications();
  }, [user]);

  const loadStudentClass = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('class')
        .eq('student_id', user.id)
        .single();

      if (data?.class) {
        setStudentClass(data.class);
      }
    } catch (error) {
      console.error('Error loading student class:', error);
      // Default to TYIT for demo
      setStudentClass('TYIT');
    }
  };

  const loadPlacementEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('placement_events')
        .select('*')
        .eq('is_active', true)
        .order('event_date', { ascending: true });

      if (error) throw error;

      // Filter events based on student's class
      const filteredEvents = (data || []).filter(event => 
        event.eligible_classes?.includes(studentClass) || 
        !event.eligible_classes || 
        event.eligible_classes.length === 0
      );

      setEvents(filteredEvents);
    } catch (error) {
      console.error('Error loading placement events:', error);
      // Mock data for development
      const mockEvents: PlacementEvent[] = [
        {
          id: '1',
          title: 'Software Developer Position',
          description: 'Join our team as a software developer.',
          company_name: 'TechCorp',
          event_date: '2024-03-15T00:00:00Z',
          application_deadline: '2024-03-01T00:00:00Z',
          requirements: 'Minimum 70% in academics',
          eligible_classes: ['TYIT', 'TYSD'],
          is_active: true,
          created_at: '2024-02-01T00:00:00Z',
        }
      ];
      setEvents(mockEvents);
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

  const applyForPlacement = async (eventId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to apply.');
      return;
    }

    try {
      setApplying(eventId);

      const { error } = await supabase
        .from('placement_applications')
        .insert({
          placement_event_id: eventId,
          student_id: user.id,
          application_status: 'applied',
        });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Already Applied', 'You have already applied for this placement.');
          return;
        }
        throw error;
      }

      Alert.alert('Success', 'Application submitted successfully!');
      loadMyApplications();
    } catch (error) {
      console.error('Application error:', error);
      Alert.alert('Error', 'Failed to submit application.');
    } finally {
      setApplying(null);
    }
  };

  const getApplicationStatus = (eventId: string) => {
    return applications.find(app => app.placement_event_id === eventId);
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
      case 'applied': return '#007AFF';
      default: return '#FF9500';
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading placements...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
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
              No placements available for your class ({studentClass})
            </Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {events.map((event) => {
              const application = getApplicationStatus(event.id);
              const deadlinePassed = isDeadlinePassed(event.application_deadline);

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
                    {application && (
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.application_status) }]}>
                        <Text style={styles.statusText}>
                          {application.application_status.toUpperCase()}
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

                  {application ? (
                    <View style={styles.appliedSection}>
                      <Text style={styles.appliedText}>
                        Applied on {formatDate(application.applied_at)}
                      </Text>
                      {application.admin_notes && (
                        <Text style={styles.adminNotes}>
                          Notes: {application.admin_notes}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.applyButton, (deadlinePassed || applying === event.id) && styles.disabledButton]}
                      onPress={() => applyForPlacement(event.id)}
                      disabled={deadlinePassed || applying === event.id}
                    >
                      <Users size={20} color="#FFFFFF" />
                      <Text style={styles.applyButtonText}>
                        {applying === event.id ? 'Applying...' : 
                         deadlinePassed ? 'Deadline Passed' : 'Apply Now'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
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
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  viewRequirementsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 16,
  },
  viewRequirementsText: {
    fontSize: 14,
    color: '#007AFF',
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
  requirementCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  requiredBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  requiredText: {
    fontSize: 10,
    color: '#FFFFFF',
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
    fontWeight: '600',
    color: '#FFFFFF',
  },
});