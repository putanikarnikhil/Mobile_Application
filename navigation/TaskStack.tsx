// navigation/TaskStack.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TasksPage from '../components/TasksPage';
import TaskDetailPage from '../components/TaskDetailPage';
import { Task, AppState, User } from '../App';
import { TaskStackParamList } from './types';

const Stack = createStackNavigator<TaskStackParamList>();

type CustomSetAppState = (newState: { user: User | null, view: 'login' | 'tasks' }) => void;

interface TaskStackProps {
  tasks: Task[];
  appState: AppState;
  setAppState: CustomSetAppState; 
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  profileImage: string | null;
  setActiveSection: React.Dispatch<React.SetStateAction<string>>; 
}

const TaskStackNavigator: React.FC<TaskStackProps> = (props) => {
  return (
    <Stack.Navigator
      initialRouteName="TasksList"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="TasksList">
        {() => ( 
          <TasksPage
            {...props}
            setActiveSection={props.setActiveSection} 
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="TaskDetail">
        {({ route, navigation }) => {
          const { task } = route.params;
          return (
            <TaskDetailPage
              task={task}
              onGoBack={() => navigation.goBack()}
              onTaskUpdate={props.appState.updateTaskStatus} 
              images={props.appState.images}
              setImages={props.appState.setImages}
              comment={props.appState.comment}
              setComment={props.appState.setComment}
              navigation={navigation as any}
              route={route as any}
            />
          );
        }}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default TaskStackNavigator;