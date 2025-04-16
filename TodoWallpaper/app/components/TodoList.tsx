import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardEvent,
  Modal,
  Linking,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import useTodoStore from '../store/todoStore';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  background: '#1A1A1A',
  surface: '#2D2D2D',
  primary: '#BB86FC',
  secondary: '#03DAC6',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  error: '#CF6679',
  gradient: {
    start: '#2C3E50',
    end: '#3498DB',
  },
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TodoList() {
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodoStore();
  const [newTodo, setNewTodo] = useState('');
  const viewShotRef = useRef<any>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const ALBUM_NAME = 'TodoWallpaper';
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const keyboardWillShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
    };

    const keyboardWillHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      keyboardWillShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      keyboardWillHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      addTodo(newTodo.trim());
      setNewTodo('');
    }
  };

  const ensureAlbumExists = async () => {
    try {
      const albums = await MediaLibrary.getAlbumsAsync();
      const todoAlbum = albums.find(album => album.title === ALBUM_NAME);
      
      if (!todoAlbum) {
        console.log('Creating new album:', ALBUM_NAME);
        return await MediaLibrary.createAlbumAsync(ALBUM_NAME, undefined, false);
      }
      
      return todoAlbum;
    } catch (error) {
      console.error('Error ensuring album exists:', error);
      throw error;
    }
  };

  const captureAndSaveImage = async () => {
    try {
      console.log('Starting image capture process...');
      
      const { status } = await MediaLibrary.requestPermissionsAsync();
      console.log('Media Library permission status:', status);
      
      if (status !== 'granted') {
        console.log('Permission denied for media library');
        Alert.alert('Permission required', 'Please grant permission to save images');
        return;
      }

      if (!viewShotRef.current) {
        console.log('ViewShot ref is null');
        Alert.alert('Error', 'Could not initialize image capture');
        return;
      }

      console.log('Attempting to capture with dimensions:', {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
      });

      try {
        // Capture the image
        const uri = await viewShotRef.current.capture();
        console.log('Capture successful, URI:', uri);

        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(uri);
        console.log('Asset created:', asset);

        // Ensure album exists and add asset to it
        const album = await ensureAlbumExists();
        console.log('Album ready:', album);

        if (asset) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          console.log('Image saved to album:', ALBUM_NAME);
          Alert.alert('Success', `Wallpaper saved to ${ALBUM_NAME} album`);
        }
      } catch (captureError) {
        console.error('Capture or save error:', captureError);
        throw captureError;
      }
    } catch (error) {
      console.error('Failed to save wallpaper:', error);
      Alert.alert(
        'Error',
        'Failed to save wallpaper. Please try again.'
      );
    }
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const openShortcutLink = async () => {
    try {
      const shortcutUrl = 'https://www.icloud.com/shortcuts/c13bb2c44201413991ab3e383e898c13';
      const supported = await Linking.canOpenURL(shortcutUrl);
      if (supported) {
        await Linking.openURL(shortcutUrl);
      } else {
        Alert.alert('Error', 'Cannot open shortcut link');
      }
    } catch (error) {
      console.error('Error opening shortcut link:', error);
    }
  };

  const renderHelpModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showHelp}
      onRequestClose={() => setShowHelp(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowHelp(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>How to Set as Wallpaper</Text>
                <TouchableOpacity 
                  onPress={() => setShowHelp(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <Text style={styles.instructionTitle}>⚙️ Create iOS Shortcut</Text>
                
                <TouchableOpacity 
                  style={styles.downloadButton}
                  onPress={openShortcutLink}
                >
                  <Ionicons name="cloud-download-outline" size={24} color={COLORS.background} />
                  <Text style={styles.downloadButtonText}>Download Shortcut</Text>
                </TouchableOpacity>

                <Text style={styles.instructionSubtitle}>Or create manually:</Text>
                
                <View style={styles.stepContainer}>
                  <Text style={styles.step}>1. Open Shortcuts app</Text>
                  <Text style={styles.step}>2. Tap "+" to create new shortcut</Text>
                  <Text style={styles.step}>3. Tap "Add Action"</Text>
                  <Text style={styles.step}>4. Find and select "Find Photos"</Text>
                  <Text style={styles.step}>5. Tap "Add Filter"</Text>
                  <Text style={styles.step}>6. Set Album to "{ALBUM_NAME}"</Text>
                  <Text style={styles.step}>7. Set Sort By to "Latest Added"</Text>
                  <Text style={styles.step}>8. Enable Limit and set to 1</Text>
                  <Text style={styles.step}>9. Add "Set Wallpaper" action</Text>
                  <Text style={styles.step}>10. Choose Lock Screen or Home Screen</Text>
                  <Text style={styles.step}>11. Name your shortcut</Text>
                </View>

                <Text style={styles.tip}>
                  💡 Tip: Add the shortcut to your home screen for quick access
                </Text>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // Regular todo list view
  const renderMainView = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Todo List</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowHelp(true)}
          >
            <Ionicons name="help-circle-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={captureAndSaveImage}
          >
            <Ionicons name="image-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.todoContainer}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'ios' ? 140 : 100 }
        ]}
      >
        {todos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateText}>No tasks yet</Text>
            <Text style={styles.emptyStateSubtext}>Add your first task below</Text>
          </View>
        ) : (
          <View>
            {todos.map((todo) => (
              <View key={todo.id} style={styles.todoItem}>
                <TouchableOpacity
                  style={styles.todoCheckbox}
                  onPress={() => toggleTodo(todo.id)}
                >
                  <View style={[styles.checkbox, todo.completed && styles.checkboxCompleted]}>
                    {todo.completed && (
                      <Ionicons name="checkmark" size={16} color={COLORS.background} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.todoText,
                      todo.completed && styles.completedText,
                    ]}
                  >
                    {todo.text}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteTodo(todo.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newTodo}
            onChangeText={setNewTodo}
            placeholder="Add a new task..."
            placeholderTextColor={COLORS.textSecondary}
            onSubmitEditing={handleAddTodo}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddTodo}>
            <Ionicons name="add" size={24} color={COLORS.background} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  // Beautiful wallpaper view for capture
  const renderWallpaperView = () => (
    <View style={styles.wallpaperContainer}>
      <View style={styles.wallpaperContent}>
        <Text style={styles.wallpaperDate}>{formatDate()}</Text>
        <Text style={styles.wallpaperTitle}>My Tasks</Text>
        
        <View style={styles.wallpaperTodos}>
          {todos.map((todo, index) => (
            <View 
              key={todo.id} 
              style={[
                styles.wallpaperTodoItem,
                { opacity: 1 - (index * 0.1) }
              ]}
            >
              <View style={[styles.wallpaperCheckbox, todo.completed && styles.wallpaperCheckboxCompleted]}>
                {todo.completed && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </View>
              <Text 
                style={[
                  styles.wallpaperTodoText,
                  todo.completed && styles.wallpaperTodoCompleted
                ]}
                numberOfLines={1}
              >
                {todo.text}
              </Text>
            </View>
          ))}
        </View>
        
        <Text style={styles.wallpaperFooter}>
          {todos.filter(t => t.completed).length} of {todos.length} completed
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          {renderMainView()}
          {renderHelpModal()}
          <View style={styles.hiddenView}>
            <ViewShot 
              ref={viewShotRef}
              options={{
                fileName: `todo-wallpaper-${Date.now()}`,
                format: "jpg",
                quality: 1,
                result: "tmpfile",
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT
              }}
            >
              {renderWallpaperView()}
            </ViewShot>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  todoContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: COLORS.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  todoCheckbox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: COLORS.primary,
  },
  todoText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  inputWrapper: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    padding: 8,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    padding: 8,
  },
  hiddenView: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    opacity: 0,
    left: -9999,
  },
  wallpaperContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: COLORS.gradient.start,
    padding: 40,
  },
  wallpaperContent: {
    flex: 1,
    justifyContent: 'center',
  },
  wallpaperDate: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontWeight: '500',
  },
  wallpaperTitle: {
    fontSize: 42,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 40,
  },
  wallpaperTodos: {
    marginBottom: 40,
  },
  wallpaperTodoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  wallpaperCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wallpaperCheckboxCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  wallpaperTodoText: {
    fontSize: 20,
    color: '#fff',
    flex: 1,
  },
  wallpaperTodoCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  wallpaperFooter: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  bottomPadding: {
    height: 80,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: '90%',
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  instructionSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginVertical: 12,
  },
  stepContainer: {
    marginVertical: 12,
  },
  step: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
    paddingLeft: 12,
  },
  tip: {
    fontSize: 16,
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 24,
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  downloadButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 