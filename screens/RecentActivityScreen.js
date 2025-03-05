import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { supabase } from '../lib/supabase';

const RecentActivityScreen = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from('activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error) {
        setActivities(data);
      }
    };

    fetchActivities();
  }, []);

  return (
    <View style={{ padding: 16 }}>
      <Text>Recent Activity</Text>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 8 }}>
            <Text>Session: {item.session_id}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Date: {new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default RecentActivityScreen;
