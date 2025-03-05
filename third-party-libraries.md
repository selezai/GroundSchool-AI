## **Third-Party Libraries Documentation** (`third-party-libraries.md`)  

### **1. Frontend Libraries**  
#### **1.1 React Navigation**  
- **Purpose**: Handle navigation between screens (Stack + Bottom Tabs).  
- **Installation**:  
  ```bash  
  npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack  
  ```  
- **Usage**:  
  ```javascript  
  import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';  
  import { createStackNavigator } from '@react-navigation/stack';  

  const Tab = createBottomTabNavigator();  
  const Stack = createStackNavigator();  

  const HomeStack = () => (  
    <Stack.Navigator>  
      <Stack.Screen name="Home" component={HomeScreen} />  
      <Stack.Screen name="Upload" component={UploadScreen} />  
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

#### **1.2 NativeBase**  
- **Purpose**: Pre-built UI components for React Native.  
- **Installation**:  
  ```bash  
  npm install native-base  
  ```  
- **Usage**:  
  ```javascript  
  import { Box, Button, Text } from 'native-base';  

  const HomeScreen = () => (  
    <Box flex={1} p={4}>  
      <Text fontSize="xl">Welcome to GroundSchool-AI</Text>  
      <Button onPress={() => console.log('Button pressed')}>Start</Button>  
    </Box>  
  );  
  ```  

---

#### **1.3 Styled Components**  
- **Purpose**: Styling and theming for React Native.  
- **Installation**:  
  ```bash  
  npm install styled-components  
  ```  
- **Usage**:  
  ```javascript  
  import styled from 'styled-components/native';  

  const Container = styled.View`  
    flex: 1;  
    background-color: ${props => props.theme.colors.background};  
  `;  
  ```  

---

#### **1.4 Zustand**  
- **Purpose**: Global state management.  
- **Installation**:  
  ```bash  
  npm install zustand  
  ```  
- **Usage**:  
  ```javascript  
  import create from 'zustand';  

  const useStore = create(set => ({  
    user: null,  
    setUser: (user) => set({ user }),  
  }));  
  ```  

---

#### **1.5 AsyncStorage**  
- **Purpose**: Persist user preferences and session data.  
- **Installation**:  
  ```bash  
  npm install @react-native-async-storage/async-storage  
  ```  
- **Usage**:  
  ```javascript  
  import AsyncStorage from '@react-native-async-storage/async-storage';  

  const saveData = async (key, value) => {  
    await AsyncStorage.setItem(key, JSON.stringify(value));  
  };  

  const getData = async (key) => {  
    const value = await AsyncStorage.getItem(key);  
    return JSON.parse(value);  
  };  
  ```  

---

### **2. Backend Libraries**  
#### **2.1 Express.js**  
- **Purpose**: Backend framework for building RESTful APIs.  
- **Installation**:  
  ```bash  
  npm install express  
  ```  
- **Usage**:  
  ```javascript  
  const express = require('express');  
  const app = express();  

  app.get('/', (req, res) => {  
    res.send('Hello, GroundSchool-AI!');  
  });  

  app.listen(3000, () => console.log('Server running on port 3000'));  
  ```  

---

#### **2.2 Supabase**  
- **Purpose**: Authentication, database, and storage.  
- **Installation**:  
  ```bash  
  npm install @supabase/supabase-js  
  ```  
- **Usage**:  
  ```javascript  
  import { createClient } from '@supabase/supabase-js';  

  const supabase = createClient(  
    process.env.SUPABASE_URL,  
    process.env.SUPABASE_KEY  
  );  

  const { data, error } = await supabase.auth.signUp({  
    email: 'user@example.com',  
    password: 'password',  
  });  
  ```  

---

#### **2.3 Redis**  
- **Purpose**: Caching for performance optimization.  
- **Installation**:  
  ```bash  
  npm install redis  
  ```  
- **Usage**:  
  ```javascript  
  const redis = require('redis');  
  const client = redis.createClient();  

  client.set('key', 'value', 'EX', 3600); // Cache for 1 hour  
  client.get('key', (err, data) => {  
    console.log(data); // 'value'  
  });  
  ```  

---

#### **2.4 Bcrypt**  
- **Purpose**: Password hashing and encryption.  
- **Installation**:  
  ```bash  
  npm install bcrypt  
  ```  
- **Usage**:  
  ```javascript  
  const bcrypt = require('bcrypt');  

  const hashPassword = async (password) => {  
    const saltRounds = 10;  
    return await bcrypt.hash(password, saltRounds);  
  };  

  const comparePassword = async (password, hash) => {  
    return await bcrypt.compare(password, hash);  
  };  
  ```  

---

### **3. Testing Libraries**  
#### **3.1 Jest**  
- **Purpose**: Unit testing for individual components and functions.  
- **Installation**:  
  ```bash  
  npm install jest  
  ```  
- **Usage**:  
  ```javascript  
  test('adds 1 + 2 to equal 3', () => {  
    expect(1 + 2).toBe(3);  
  });  
  ```  

---

#### **3.2 React Testing Library**  
- **Purpose**: Integration testing for interactions between components and APIs.  
- **Installation**:  
  ```bash  
  npm install @testing-library/react-native  
  ```  
- **Usage**:  
  ```javascript  
  import { render, fireEvent } from '@testing-library/react-native';  
  import HomeScreen from './screens/HomeScreen';  

  test('renders welcome message', () => {  
    const { getByText } = render(<HomeScreen />);  
    expect(getByText('Welcome to GroundSchool-AI')).toBeTruthy();  
  });  
  ```  

---

### **4. AI Integration**  
#### **4.1 Claude API**  
- **Purpose**: AI-powered text extraction and question generation.  
- **Integration**:  
  - Use the Claude API (free version) for processing uploaded files.  
  - Example:  
    ```javascript  
    const generateQuestions = async (filePath) => {  
      const text = await extractText(filePath);  
      const questions = await claudeAPI.generateQuestions(text);  
      return questions;  
    };  
    ```  
