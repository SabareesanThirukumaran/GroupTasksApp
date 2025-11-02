import * as Notifications from 'expo-notifications'
import {Platform, LogBox} from 'react-native'

LogBox.ignoreLogs([
  'expo-notifications',
  'Android Push notifications'
]);

Notifications.setNotificationHandler({
    handleNotification: async() => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    })
});

export async function requestNotificationPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0F6EC6',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    alert('Please enable notifications in your device settings to receive task reminders.');
    return false;
  }

  return true;
}

export async function scheduleTaskDeadlineNotification(task) {
  try {
    if (!task.dueDate) return null;

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return null;
    }

    const [year, month, day] = task.dueDate.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    const now = new Date();

    const dueDateStartOfDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const todayStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const daysUntilDeadline = Math.floor((dueDateStartOfDay - todayStartOfDay) / (1000 * 60 * 60 * 24));

    const notifications = [];

    if (daysUntilDeadline < 0) {
      console.log('Task deadline is in the past, skipping notifications');
      return null;
    }

    if (daysUntilDeadline >= 1) {
      const oneDayBefore = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate() - 1,
        18, 0, 0
      );

      if (oneDayBefore > now) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '📅 Task Due Tomorrow!',
            body: `"${task.title}" is due tomorrow`,
            data: { taskId: task.id, type: '1day' },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: { date: oneDayBefore },
        });
        notifications.push(notificationId);
        console.log(`✅ Scheduled 1-day notification for ${oneDayBefore.toLocaleString()}`);
      }
    }

    const dueDateMorning = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
      9, 0, 0
    );

    if (dueDateMorning > now) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Task Due Today!',
          body: `"${task.title}" is due today`,
          data: { taskId: task.id, type: 'morning' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { date: dueDateMorning },
      });
      notifications.push(notificationId);
      console.log(`✅ Scheduled morning notification for ${dueDateMorning.toLocaleString()}`);
    }

    const dueDateEvening = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
      18, 0, 0
    );

    if (dueDateEvening > now) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 Task Deadline Today!',
          body: `"${task.title}" is due today - don't forget!`,
          data: { taskId: task.id, type: 'evening' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: { date: dueDateEvening },
      });
      notifications.push(notificationId);
      console.log(`✅ Scheduled evening notification for ${dueDateEvening.toLocaleString()}`);
    }

    console.log(`📱 Scheduled ${notifications.length} local notifications for: ${task.title}`);
    return notifications;
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
    return null;
  }
}

export async function cancelTaskNotifications(taskId) {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.taskId === taskId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
    
    console.log('✅ Cancelled notifications for task:', taskId);
  } catch (error) {
    console.error('❌ Error cancelling notifications:', error);
  }
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ All notifications cancelled');
  } catch (error) {
    console.error('❌ Error cancelling all notifications:', error);
  }
}

export async function getScheduledNotifications() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📋 ${notifications.length} scheduled notifications:`, notifications);
    return notifications;
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    return [];
  }
}