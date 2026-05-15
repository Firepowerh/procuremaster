import { View, ActivityIndicator } from 'react-native'

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
      <ActivityIndicator size="large" color="#4f46e5" />
    </View>
  )
}
