import React from 'react';
import { View, Text, Button } from 'react-native';
import useStore from '../store';

const ProfileScreen = () => {
  const { user, setUser } = useStore();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout failed:', error.message);
    } else {
      setUser(null);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text>Email: {user?.email}</Text>
      <Button title="Log out" onPress={handleLogout} />
    </View>
  );
};

export default ProfileScreen;
