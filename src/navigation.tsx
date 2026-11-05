import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import { useTheme } from './theme';
import { RootStackParamList } from './types';
import { ForgotScreen, LoginScreen, SignupScreen } from './screens/AuthScreens';
import HomeScreen from './screens/HomeScreen';
import QuestionListScreen from './screens/QuestionListScreen';
import QuestionDetailScreen from './screens/QuestionDetailScreen';
import BookmarksScreen from './screens/BookmarksScreen';
import ProgressScreen from './screens/ProgressScreen';
import { MockSessionScreen, MockSetupScreen, MockSummaryScreen } from './screens/MockScreens';
import ProfileScreen from './screens/ProfileScreen';
import { AdminQuestionFormScreen, AdminScreen } from './screens/AdminScreens';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home', Mock: 'timer', Bookmarks: 'bookmark', Progress: 'stats-chart', Profile: 'person',
};

function Tabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} size={size} color={color} />,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.sub,
      tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      headerStyle: { backgroundColor: colors.card },
      headerTintColor: colors.text,
      headerShadowVisible: false,
      headerTitleStyle: { fontWeight: '700' },
    })}
    >
      <Tab.Screen name='Home' component={HomeScreen} options={{ title: 'InterviewPrep', tabBarLabel: 'Home' }} />
      <Tab.Screen name='Mock' component={MockSetupScreen} options={{ title: 'Mock Interview', tabBarLabel: 'Mock' }} />
      <Tab.Screen name='Bookmarks' component={BookmarksScreen} />
      <Tab.Screen name='Progress' component={ProgressScreen} />
      <Tab.Screen name='Profile' component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { mode, colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    );
  }

  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: colors.bg, card: colors.card, text: colors.text, primary: colors.primary, border: colors.border },
  };

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text }}>
          {user ? (
            <>
              <Stack.Screen name='Tabs' component={Tabs} options={{ headerShown: false }} />
              <Stack.Screen name='QuestionList' component={QuestionListScreen} options={({ route }) => ({ title: route.params.title })} />
              <Stack.Screen name='QuestionDetail' component={QuestionDetailScreen} options={{ title: 'Question' }} />
              <Stack.Screen name='MockSession' component={MockSessionScreen} options={{ title: 'Mock Interview' }} />
              <Stack.Screen name='MockSummary' component={MockSummaryScreen} options={{ title: 'Summary', headerBackVisible: false }} />
              <Stack.Screen name='Admin' component={AdminScreen} options={{ title: 'Admin Panel' }} />
              <Stack.Screen name='AdminQuestionForm' component={AdminQuestionFormScreen} options={{ title: 'Question' }} />
            </>
          ) : (
            <>
              <Stack.Screen name='Login' component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen name='Signup' component={SignupScreen} options={{ headerShown: false }} />
              <Stack.Screen name='Forgot' component={ForgotScreen} options={{ headerShown: false }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
