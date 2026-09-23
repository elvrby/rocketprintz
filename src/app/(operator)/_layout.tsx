import {
    Redirect,
    Stack,
} from "expo-router";

import {
    ActivityIndicator,
    View,
} from "react-native";

import {
    useAuth,
} from "../../contexts/AuthContext";

export default function OperatorLayout() {

  const {
    user,
    profile,
    loading,
  } = useAuth();

  if (loading) {

    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {

    return (
      <Redirect href="/(auth)/login" />
    );
  }

  if (
    !profile ||
    profile.role !== "operator"
  ) {

    return (
      <Redirect href="/" />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}