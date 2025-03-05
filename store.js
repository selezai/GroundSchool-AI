import create from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useStore = create((set) => ({
  user: null,
  setUser: async (user) => {
    set({ user });
    await AsyncStorage.setItem('user', JSON.stringify(user));
  },
  clearUser: async () => {
    set({ user: null });
    await AsyncStorage.removeItem('user');
  },
}));

export default useStore;
