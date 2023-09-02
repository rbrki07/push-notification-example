// @ts-check
import React, { useEffect, useState } from "react"
import { Button, Platform, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from "expo-constants";

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState(undefined);

  const [notificationsPermissions, setNotificationsPermissions] = useState({
    canAskAgain: undefined,
    expires: undefined,
    granted: undefined,
    status: undefined,
  });

  useEffect(() => {
    const getNotificationsPermissions = async () => {
      const { canAskAgain, expires, granted, status } = await Notifications.getPermissionsAsync();
      // @ts-ignore
      setNotificationsPermissions({ canAskAgain, expires, granted, status });
    };
    getNotificationsPermissions();
  }, [])

  console.log('notificationsPermissions', notificationsPermissions)

  useEffect(() => {
    if (notificationsPermissions.granted === true) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    }
  }, [notificationsPermissions.granted])

  useEffect(() => {
    if (notificationsPermissions.granted === true && Platform.OS === "android") {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT
      })
    }
  }, [notificationsPermissions.granted])

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Received notification while app is running in foreground', notification)
    });
    return () => {
      subscription.remove();
    }
  }, [])

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User interacted with notification', response.notification)
    });
    return () => {
      subscription.remove();
    }
  }, [])

  return (
    <View style={styles.container}>
      {notificationsPermissions.granted === false && notificationsPermissions.canAskAgain === true &&
        <Button 
          title={'Request notification permission'} 
          onPress={async () => {
            const { canAskAgain, expires, granted, status } =
              await Notifications.requestPermissionsAsync({
                ios: {
                  allowAlert: true,
                  allowBadge: true,
                  allowSound: true,
                },
              });
            // @ts-ignore
            setNotificationsPermissions({ canAskAgain, expires, granted, status });
          }}
        />
      }
      {Device.isDevice === false &&
        <Text>Push notifications don't work on emulators/simulators.</Text>
      }
      {notificationsPermissions.granted === true && Device.isDevice && expoPushToken === undefined && 
        <Button 
          title={'Get Expo Push-Token'}
          onPress={async () => {
            const expoPushToken = await Notifications.getExpoPushTokenAsync({
              projectId: Constants.expoConfig?.extra?.eas.projectId,
            });
            console.log('expoPushToken', expoPushToken);
            // @ts-ignore
            setExpoPushToken(expoPushToken);
          }}
        />
      }
      {expoPushToken && 
        <View>
          <Text>Expo Push-Token:</Text>
          {/* @ts-ignore */}
          <Text>{expoPushToken?.data}</Text>
        </View>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
