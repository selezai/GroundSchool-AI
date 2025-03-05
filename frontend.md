## **Frontend Documentation** (`frontend.md`)  

### **1. UI Framework & Library**  
- **Framework**: React Native (cross-platform mobile development for iOS and Android).  
- **UI Library**: NativeBase (pre-built components, customizable, and aligns well with React Native).  

---

### **2. Styling**  
- **Library**: Styled Components (flexible, integrates well with React Native, and supports dynamic theming).  
- **Example**:  
  ```javascript  
  import styled from 'styled-components/native';  

  const Container = styled.View`  
    flex: 1;  
    background-color: ${props => props.theme.colors.background};  
    padding: 16px;  
  `;  

  const Button = styled.TouchableOpacity`  
    background-color: ${props => props.theme.colors.primary};  
    padding: 12px;  
    border-radius: 8px;  
    align-items: center;  
  `;  
  ```  

---

### **3. Navigation**  
- **Library**: React Navigation (Stack + Bottom Tabs).  
- **Structure**:  
  - **Bottom Navigation Bar**:  
    - **Home Button**: Navigates to Home Screen.  
    - **Profile Button**: Navigates to Profile Screen.  
  - **Stack Navigation**:  
    - **Home Screen**: Central hub with Question Bank and Recent Activity buttons.  
    - **Upload Screen**: PDF/Image upload functionality.  
    - **Question Bank**: Displays generated MCQs.  
    - **Results Screen**: Pass/fail status and review incorrect answers.  
    - **Recent Activity**: Lists past attempts with resume options.  
    - **Profile Screen**: User email, logout, and contact support.  

- **Example**:  
  ```javascript  
  import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';  
  import { createStackNavigator } from '@react-navigation/stack';  

  const Tab = createBottomTabNavigator();  
  const Stack = createStackNavigator();  

  const HomeStack = () => (  
    <Stack.Navigator>  
      <Stack.Screen name="Home" component={HomeScreen} />  
      <Stack.Screen name="Upload" component={UploadScreen} />  
      <Stack.Screen name="QuestionBank" component={QuestionBankScreen} />  
      <Stack.Screen name="Results" component={ResultsScreen} />  
      <Stack.Screen name="RecentActivity" component={RecentActivityScreen} />  
    </Stack.Navigator>  
  );  

  const AppNavigator = () => (  
    <Tab.Navigator>  
      <Tab.Screen name="Home" component={HomeStack} />  
      <Tab.Screen name="Profile" component={ProfileScreen} />  
    </Tab.Navigator>  
  );  
  ```  

---

### **4. State Management**  
- **Global State**: Zustand (lightweight, easy to use, and perfect for this app’s scale).  
- **Persistence**: AsyncStorage (persist user preferences and session data).  
- **Example**:  
  ```javascript  
  import create from 'zustand';  
  import AsyncStorage from '@react-native-async-storage/async-storage';  

  const useStore = create(set => ({  
    user: null,  
    setUser: async (user) => {  
      set({ user });  
      await AsyncStorage.setItem('user', JSON.stringify(user));  
    },  
  }));  
  ```  

---

### **5. Key Components**  
#### **5.1 Question Bank**  
- Displays generated MCQs (8–50 questions).  
- Immediate feedback on answers (pass/fail at 75%).  
- References to study materials for incorrect answers.  

#### **5.2 Recent Activity**  
- Lists past attempts (complete/incomplete) with resume options.  
- Data retained for 30 days (auto-deleted after).  

#### **5.3 Profile Screen**  
- Displays user email.  
- **Log Out**: Clears session and redirects to Login/Signup.  
- **Contact Support**: Opens email client with pre-filled recipient (`groundschoolai@gmail.com`).  

---

### **6. Performance Optimization**  
- **Lazy Loading**: Load components only when needed (e.g., Question Bank).  
- **Code Splitting**: Split code into smaller bundles for faster loading.  
- **Example**:  
  ```javascript  
  const QuestionBankScreen = React.lazy(() => import('./screens/QuestionBankScreen'));  
  ```  

---

### **7. Testing**  
- **Unit Testing**: Jest for testing individual components and functions.  
- **Integration Testing**: React Testing Library for testing interactions between components and APIs.  
- **Example**:  
  ```javascript  
  import { render, fireEvent } from '@testing-library/react-native';  
  import QuestionBankScreen from './screens/QuestionBankScreen';  

  test('renders question bank correctly', () => {  
    const { getByText } = render(<QuestionBankScreen />);  
    expect(getByText('Question 1')).toBeTruthy();  
  });  
  ```  

---

### **8. Theming**  
- **Dark Mode Default**: Dark navy/black background with neon blue/green accents.  
- **Light Mode Toggle**: Optional light mode for accessibility.  
- **Example**:  
  ```javascript  
  const theme = {  
    colors: {  
      background: '#0A0F24', // Dark navy  
      primary: '#00FFCC', // Neon blue  
      text: '#FFFFFF', // White  
    },  
  };  
  ```  

---

### **9. Error Handling**  
- **Network Errors**: Show toast messages for failed API calls.  
- **Invalid Input**: Validate user inputs (e.g., file uploads).  
- **Example**:  
  ```javascript  
  const handleUpload = async (file) => {  
    try {  
      const response = await uploadFile(file);  
      if (response.error) throw new Error(response.error);  
    } catch (error) {  
      console.error('[Upload] Failed:', error.message);  
      Toast.show({  
        type: 'error',  
        text1: 'Upload failed',  
        text2: 'Please try again.',  
      });  
    }  
  };  
  ```  

---

### **10. Third-Party Libraries**  
- **React Navigation**: Navigation between screens.  
- **NativeBase**: Pre-built UI components.  
- **Styled Components**: Styling and theming.  
- **Zustand**: Global state management.  
- **AsyncStorage**: Persist user preferences and session data.  
- **Jest & React Testing Library**: Unit and integration testing.  

