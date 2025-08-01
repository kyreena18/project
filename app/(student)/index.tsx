import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { LogOut, User, Briefcase, GraduationCap, BookOpen, Calendar, Clock, Speaker, SpeakerIcon } from 'lucide-react-native'; // Import necessary icons
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function StudentDashboard() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // State to manage which tab is active

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/student-login');
  };

  // Only the first three quick stats are kept
  const quickStats = [
    { title: 'Placement Announcements', value: '2', icon: Speaker, color: '#007AFF' },
    { title: 'Internships', value: '3', icon: Calendar, color: '#34C759' },
  ];

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.studentText}>{user?.name || 'Student'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats Section */}
        <View style={styles.quickStatsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.quickStatsGrid}>
            {quickStats.map((stat, index) => (
              <LinearGradient
                key={index}
                colors={['#FFFFFF', '#F0F0F0']}
                style={styles.quickStatCard}
              >
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </LinearGradient>
            ))}
          </View>
        </View>

        {/* The rest of the content area is now blank, acting as your "blank page" */}
      </ScrollView>

      {/* Custom Bottom Tab Bar */}
      
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
  welcomeText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  studentText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20, // Space for the bottom tab bar
  },
  // Quick Stats Styles
  quickStatsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickStatCard: {
    width: '48%', // Roughly half width for two columns
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start', // Align content to start
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  statIconContainer: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  // Custom Bottom Tab Bar Styles (retained from previous step)
  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingVertical: 10,
    height: 88,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  tabText: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 4,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});