/**
 * @format
 */

import { AppRegistry } from 'react-native';
import React from 'react';
import { AppSafeAreaProvider } from './src/AppSafeArea';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => () => <AppSafeAreaProvider><App /></AppSafeAreaProvider>);
