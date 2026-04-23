import { Redirect } from "expo-router";

export default function Index() {
  // _layout's useAuthRouting() will redirect to (auth) / (onboarding) / (tabs)
  return <Redirect href="/(tabs)" />;
}
