import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Briefcase, Calendar, Clock, Users, Eye, X, Download, FileText, Trash2, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

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
  bucket_name: string;
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
  };
  student_profiles?: {
    full_name: string;
    class: string;
    resume_url?: string;
  };
}

interface RequirementSubmission {
  id: string;
  placement_application_id: string;
  requirement_id: string;
  file_url: string;
  submission_status: string;
  submitted_at: string;
  admin_feedback?: string;
  placement_requirements: {
    type: string;
    description: string;
    is_required: boolean;
  };
}

export default function AdminPlacementsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<PlacementEvent[]>([]);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [requirements, setRequirements] = useState<PlacementRequirement[]>([]);
  const [requirementSubmissions, setRequirementSubmissions] = useState<RequirementSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
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

  const requirementTypes = [
    { value: 'marksheet_10th', label: '10th Grade Marksheet' },
    { value: 'marksheet_12th', label: '12th Grade Marksheet' },
    { value: 'video', label: 'Video Portfolio' },
    { value: 'portfolio', label: 'Project Portfolio' },
    { value: 'resume', label: 'Resume/CV' },
    { value: 'cover_letter', label: 'Cover Letter' },
    { value: 'transcript', label: 'Academic Transcript' },
    { value: 'other', label: 'Other Document' },
  ];

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

  const loadEventRequirements = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('placement_requirements')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRequirements(data || []);
    } catch (error) {
      console.error('Error loading requirements:', error);
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
      setApplications([]);
    }
  };

  const loadRequirementSubmissions = async (eventId: string) => {
    try {
      if (applications.length === 0) return;
      
      const applicationIds = applications.map(app => app.id);
      
      const { data, error } = await supabase
        .from('student_requirement_submissions')
        .select(`
          *,
          placement_requirements (type, description, is_required)
        `)
        .in('placement_application_id', applicationIds);

      if (error) throw error;
      setRequirementSubmissions(data || []);
    } catch (error) {
      console.error('Error loading requirement submissions:', error);
    }
  };

  const createCompanyBucket = async (companyName: string): Promise<string> => {
    try {
      // Create a safe bucket name from company name
      const bucketName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-placement';
      
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['application/pdf', 'image/*', 'video/*'],
        fileSizeLimit: 50485760, // 50MB
      });

      if (error && !error.message.includes('already exists')) {
        console.warn('Bucket creation failed:', error);
        throw error;
      }

      console.log('Company placement bucket created/verified:', bucketName);
      return bucketName;
    } catch (error) {
      console.error('Error creating company bucket:', error);
      throw error;
    }
  };

  const addRequirement = () => {
    setNewRequirements([...newRequirements, {
      type: 'resume',
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

  const createPlacementEvent = async () => {
    if (!user?.id) {
      Alert.alert('Authentication Error', 'Please log in as an admin to create placement events.');
      return;
    }

    const { title, company_name, event_date, application_deadline } = newEvent;

    if (!title || !company_name || !event_date || !application_deadline) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      
      // Validate date formats
      const eventDate = new Date(newEvent.event_date);
      const deadlineDate = new Date(newEvent.application_deadline);
      
      if (isNaN(eventDate.getTime()) || isNaN(deadlineDate.getTime())) {
        Alert.alert('Error', 'Please enter valid dates in YYYY-MM-DD format');
        return;
      }

      // 1. Create company-specific storage bucket
      const bucketName = await createCompanyBucket(newEvent.company_name);

      // 2. Insert placement event with bucket name
      const { data: eventData, error: eventError } = await supabase
        .from('placement_events')
        .insert({
          title: newEvent.title,
          description: newEvent.description,
          company_name: newEvent.company_name,
          event_date: eventDate.toISOString(),
          application_deadline: deadlineDate.toISOString(),
          requirements: newEvent.requirements,
          bucket_name: bucketName,
          created_by: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (eventError) {
        console.error('Event creation error:', eventError);
        throw eventError;
      }

      console.log('Event created successfully with ID:', eventData.id);

      // 3. Insert requirements if any
      if (newRequirements.length > 0) {
        const requirementsToInsert = newRequirements
          .filter(req => req.description.trim() !== '')
          .map(req => ({
            event_id: eventData.id,
            type: req.type,
            description: req.description,
            is_required: req.is_required,
          }));

        if (requirementsToInsert.length > 0) {
          const { error: reqError } = await supabase
            .from('placement_requirements')
            .insert(requirementsToInsert);

          if (reqError) {
            console.error('Requirements insertion error:', reqError);
            // Continue even if requirements fail
          }
        }
      }

      Alert.alert('Success', `Placement event for ${newEvent.company_name} created successfully!`);
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        company_name: '',
        event_date: '',
        application_deadline: '',
        requirements: '',
      });
      setNewRequirements([]);
      loadPlacementEvents();
    } catch (error: any) {
      console.error('Error creating placement event:', error);
      Alert.alert('Error', `Failed to create placement event: ${error.message || 'Unknown error'}`);
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

  const exportApplicationsToExcel = async () => {
    if (!selectedEventId || applications.length === 0) {
      Alert.alert('No Data', 'No applications to export');
      return;
    }

    try {
      setExporting(true);

      const eventForExport = events.find(e => e.id === selectedEventId);
      const companyName = eventForExport?.company_name || 'Unknown';

      // Prepare comprehensive data for Excel export
      const headers = [
        'Student Name', 
        'UID', 
        'Roll No', 
        'Email', 
        'Class', 
        'Resume URL',
        'Application Status', 
        'Applied Date', 
        'Admin Notes'
      ];
      
      // Add requirement columns
      requirements.forEach(req => {
        headers.push(`${req.description} - File URL`);
        headers.push(`${req.description} - Status`);
        headers.push(`${req.description} - Admin Feedback`);
      });

      const rows = [headers];

      // Add student data rows
      for (const app of applications) {
        const studentName = app.student_profiles?.full_name || app.students.name;
        const className = app.student_profiles?.class || 'N/A';
        const appliedDate = new Date(app.applied_at).toLocaleDateString();
        const adminNotes = app.admin_notes || '';
        const resumeUrl = app.student_profiles?.resume_url || 'Not uploaded';

        const row = [
          studentName,
          app.students.uid,
          app.students.roll_no,
          app.students.email,
          className,
          resumeUrl,
          app.application_status,
          appliedDate,
          adminNotes
        ];

        // Add requirement submission data
        for (const req of requirements) {
          const submission = requirementSubmissions.find(
            sub => sub.placement_application_id === app.id && sub.requirement_id === req.id
          );
          
          if (submission) {
            row.push(submission.file_url || 'No file');
            row.push(submission.submission_status);
            row.push(submission.admin_feedback || 'No feedback');
          } else {
            row.push('Not submitted');
            row.push('Not submitted');
            row.push('Not submitted');
          }
        }

        rows.push(row);
      }

      // Create workbook and worksheet
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Applications');

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      // Save to file
      const fileName = `${companyName}_placement_applications_${Date.now()}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export Placement Applications',
        });
      } else {
        Alert.alert('Success', `File saved to: ${fileUri}`);
      }

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export applications');
    } finally {
      setExporting(false);
    }
  };

  const viewApplications = async (eventId: string) => {
    setSelectedEventId(eventId);
    await loadEventRequirements(eventId);
    await loadApplications(eventId);
    setShowApplicationsModal(true);
    
    // Load requirement submissions after applications are loaded
    setTimeout(() => {
      loadRequirementSubmissions(eventId);
    }, 500);
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

  const getRequirementTypeLabel = (type: string) => {
    const found = requirementTypes.find(rt => rt.value === type);
    return found ? found.label : type;
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
            <Text style={styles.statNumber}>
              {events.reduce((total, event) => total + getApplicationCount(event.id), 0)}
            </Text>
            <Text style={styles.statLabel}>Total Applications</Text>
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
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => viewApplications(event.id)}
                >
                  <Eye size={16} color="#007AFF" />
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
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
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
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
                placeholder="YYYY-MM-DD (e.g., 2024-12-25)"
                value={newEvent.event_date}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, event_date: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Application Deadline *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (e.g., 2024-12-20)"
                value={newEvent.application_deadline}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, application_deadline: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>General Requirements</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="List the general requirements for this placement..."
                value={newEvent.requirements}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, requirements: text }))}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Dynamic Requirements Section */}
            <View style={styles.formGroup}>
              <View style={styles.requirementsHeader}>
                <Text style={styles.label}>Additional Document Requirements</Text>
                <TouchableOpacity style={styles.addRequirementButton} onPress={addRequirement}>
                  <Plus size={16} color="#007AFF" />
                  <Text style={styles.addRequirementText}>Add Requirement</Text>
                </TouchableOpacity>
              </View>

              {newRequirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                  <View style={styles.requirementHeader}>
                    <Text style={styles.requirementTitle}>Requirement {index + 1}</Text>
                    <TouchableOpacity onPress={() => removeRequirement(index)}>
                      <Trash2 size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.requirementTypeContainer}>
                    <Text style={styles.requirementLabel}>Type:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.typeOptions}>
                        {requirementTypes.map((type) => (
                          <TouchableOpacity
                            key={type.value}
                            style={[
                              styles.typeOption,
                              req.type === type.value && styles.selectedType
                            ]}
                            onPress={() => updateRequirement(index, 'type', type.value)}
                          >
                            <Text style={[
                              styles.typeText,
                              req.type === type.value && styles.selectedTypeText
                            ]}>
                              {type.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Description (e.g., Upload your video portfolio showcasing your projects)"
                    value={req.description}
                    onChangeText={(text) => updateRequirement(index, 'description', text)}
                  />

                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => updateRequirement(index, 'is_required', !req.is_required)}
                  >
                    <View style={[styles.checkbox, req.is_required && styles.checkedBox]}>
                      {req.is_required && <CheckCircle size={16} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.checkboxLabel}>Required</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.createEventButton, creating && styles.disabledButton]}
              onPress={createPlacementEvent}
              disabled={creating}
            >
              <Text style={styles.createEventButtonText}>
                {creating ? 'Creating Event & Bucket...' : 'Create Placement Event'}
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
            <View style={styles.modalHeaderActions}>
              <TouchableOpacity
                style={[styles.exportButton, exporting && styles.disabledButton]}
                onPress={exportApplicationsToExcel}
                disabled={exporting || applications.length === 0}
              >
                <Download size={16} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>
                  {exporting ? 'Exporting...' : 'Export Excel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowApplicationsModal(false)}>
                <X size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Requirements Summary */}
            {requirements.length > 0 && (
              <View style={styles.requirementsSummary}>
                <Text style={styles.requirementsSummaryTitle}>Document Requirements for this Event:</Text>
                {requirements.map((req) => (
                  <View key={req.id} style={styles.requirementSummaryItem}>
                    <Text style={styles.requirementSummaryText}>
                      • {req.description} {req.is_required && '(Required)'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

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
                      <View style={[styles.applicationStatus, {
                        backgroundColor: application.application_status === 'accepted' ? '#34C759' : 
                                       application.application_status === 'rejected' ? '#FF3B30' : '#FF9500'
                      }]}>
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
                          <TouchableOpacity style={styles.resumeLink}>
                            <FileText size={14} color="#007AFF" />
                            <Text style={styles.resumeText}>View Resume</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    <Text style={styles.appliedDate}>
                      Applied: {formatDate(application.applied_at)}
                    </Text>

                    {/* Document Submissions */}
                    {requirements.length > 0 && (
                      <View style={styles.documentsSection}>
                        <Text style={styles.documentsSectionTitle}>Document Submissions:</Text>
                        {requirements.map((req) => {
                          const submission = requirementSubmissions.find(
                            sub => sub.placement_application_id === application.id && sub.requirement_id === req.id
                          );
                          return (
                            <View key={req.id} style={styles.documentItem}>
                              <FileText size={14} color="#6B6B6B" />
                              <View style={styles.documentInfo}>
                                <Text style={styles.documentText}>
                                  {getRequirementTypeLabel(req.type)}:
                                </Text>
                                {submission ? (
                                  <TouchableOpacity style={styles.documentLink}>
                                    <Text style={styles.documentLinkText}>View Document</Text>
                                    <Text style={[styles.documentStatus, {
                                      color: submission.submission_status === 'approved' ? '#34C759' : '#FF9500'
                                    }]}>
                                      ({submission.submission_status})
                                    </Text>
                                  </TouchableOpacity>
                                ) : (
                                  <Text style={styles.notSubmittedText}>Not Submitted</Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {application.admin_notes && (
                      <View style={styles.adminNotesSection}>
                        <Text style={styles.adminNotesTitle}>Admin Notes:</Text>
                        <Text style={styles.adminNotesText}>{application.admin_notes}</Text>
                      </View>
                    )}

                    {application.application_status === 'pending' && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => updateApplicationStatus(application.id, 'accepted', 'Application accepted')}
                        >
                          <CheckCircle size={16} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={() => updateApplicationStatus(application.id, 'rejected', 'Application rejected')}
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
    marginBottom: 2,
  },
  bucketInfo: {
    fontSize: 12,
    color: '#6B6B6B',
    fontStyle: 'italic',
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
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  exportButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
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
  requirementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addRequirementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  requirementTypeContainer: {
    marginBottom: 12,
  },
  requirementLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B6B6B',
    marginBottom: 8,
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 8,
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
    gap: 12,
    marginTop: 8,
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
  requirementsSummary: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  requirementsSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  requirementSummaryItem: {
    marginBottom: 4,
  },
  requirementSummaryText: {
    fontSize: 14,
    color: '#6B6B6B',
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
    marginBottom: 4,
  },
  resumeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resumeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  appliedDate: {
    fontSize: 12,
    color: '#6B6B6B',
    marginBottom: 12,
  },
  documentsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  documentsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  documentInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentText: {
    fontSize: 12,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  documentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  documentLinkText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  documentStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  notSubmittedText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
  adminNotesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
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