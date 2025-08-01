import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { User, Shield, Bell, Database, LogOut, ChevronRight } from 'lucide-react-native';

export default function AdminSettings() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace('/');
  };

  const settingsItems = [
    { icon: User, title: 'Profile Settings', subtitle: 'Update your admin profile', color: '#007AFF' },
    { icon: Shield, title: 'Security', subtitle: 'Password and authentication', color: '#34C759' },
    { icon: Bell, title: 'Notifications', subtitle: 'Manage notification preferences', color: '#FF9500' },
    { icon: Database, title: 'Data Management', subtitle: 'Backup and export data', color: '#AF52DE' },
  ];

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>AD</Text>
            </View>
            <Text style={styles.profileName}>Administrator</Text>
            <Text style={styles.profileEmail}>admin@college.edu</Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            {settingsItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
                  <item.icon size={20} color="#FFFFFF" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                </View>
                <ChevronRight size={20} color="#6B6B6B" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.systemSection}>
          <Text style={styles.sectionTitle}>System</Text>
          <View style={styles.settingsCard}>
            <View style={styles.systemInfo}>
              <Text style={styles.systemLabel}>System Version</Text>
              <Text style={styles.systemValue}>v1.0.0</Text>
            </View>
            <View style={styles.systemInfo}>
              <Text style={styles.systemLabel}>Database Status</Text>
              <Text style={[styles.systemValue, { color: '#34C759' }]}>Connected</Text>
            </View>
            <View style={styles.systemInfo}>
              <Text style={styles.systemLabel}>Last Backup</Text>
              <Text style={styles.systemValue}>Today, 3:00 PM</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInitials: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingIcon: {
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  systemSection: {
    marginBottom: 32,
  },
  systemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  systemLabel: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  systemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 40,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});