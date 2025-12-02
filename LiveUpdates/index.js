

import { AppRegistry, NativeModules, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

if (Platform.OS === 'android') {
  try {
    const { MyServiceModule } = NativeModules;

    if (MyServiceModule && MyServiceModule.startService) {
      console.log("Starting background MyService...");
      MyServiceModule.startService();
    } else {
      console.log("MyServiceModule not found");
    }

  } catch (e) {
    console.log("Error starting service:", e);
  }
}
