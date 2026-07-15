import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { notificationService } from './src/services/notificationService';

function App(): React.JSX.Element {
  React.useEffect(() => {
    // Initialize FCM: request permission, get token, register with backend
    notificationService.init();

    // Listen for foreground notifications
    const unsubscribe = notificationService.listenForeground((title, body) => {
      Alert.alert(title, body);
    });

    // Handle notification tap when app was backgrounded
    notificationService.onNotificationOpenedApp((data) => {
      console.log('[FCM] Notification opened with data:', data);
      // TODO: navigate to relevant screen based on data.screen
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
