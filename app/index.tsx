import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { UserCog, GraduationCap } from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Campus Connect</Text>
        <Text style={styles.subtitle}>Choose your login type</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/admin-login')}
          >
            <View style={styles.buttonContent}>
              <UserCog size={32} color="#007AFF" />
              <Text style={styles.buttonText}>Admin Login</Text>
              <Text style={styles.buttonSubtext}>Access administrative features</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/student-login')}
          >
            <View style={styles.buttonContent}>
              <GraduationCap size={32} color="#007AFF" />
              <Text style={styles.buttonText}>Student Login</Text>
              <Text style={styles.buttonSubtext}>Access your student portal</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 12,
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
  },
});