import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Briefcase, Users, Eye, X } from 'lucide-react-native';
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

export default function AdminPlacementsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<PlacementEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const createPlacementEvent = async () => {
    console.log('Create button clicked!');
    
    if (!newEvent.title || !newEvent.company_name) {
      Alert.alert('Error', 'Please fill in title and company name');
      return;
    }

    try {
      setCreating(true);
      console.log('Creating event with data:', newEvent);

      const { data, error } = await supabase
        .from('placement_events')
        .insert({
          title: newEvent.title,
          description: newEvent.description,
          company_name: newEvent.company_name,
          event_date: newEvent.event_date || new Date().toISOString(),
          application_deadline: newEvent.application_deadline || new Date().toISOString(),
          requirements: newEvent.requirements,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Event created successfully:', data);
      Alert.alert('Success', 'Placement event created successfully!');
      
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
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create placement event');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
              <Text style={styles.eventDate}>Created: {formatDate(event.created_at)}</Text>
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
              <Text style={styles.label}>Event Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (optional)"
                value={newEvent.event_date}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, event_date: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Application Deadline</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (optional)"
                value={newEvent.application_deadline}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, application_deadline: text }))}
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
  eventDate: {
    fontSize: 12,
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
});