import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import TodoList from './components/TodoList';

const COLORS = {
  background: '#1A1A1A',
};

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <TodoList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
}); 