import { Alert, Platform } from 'react-native';

/**
 * 确认对话框。
 * react-native-web 的 Alert.alert 是空函数,网页上必须走 window.confirm,
 * 否则「删除」点了没有任何效果。
 */
export function confirmDialog(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: '取消', style: 'cancel', onPress: () => resolve(false) },
      { text: '确定', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

/** 轻提示。网页用 window.alert,原生用 Alert。 */
export function notify(message: string): void {
  if (Platform.OS === 'web') {
    window.alert(message);
    return;
  }
  Alert.alert(message);
}
