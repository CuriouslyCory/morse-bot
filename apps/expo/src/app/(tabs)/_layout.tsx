import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarPosition: "bottom",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Decoder",
        }}
      />
      <Tabs.Screen
        name="encoder"
        options={{
          title: "Encoder",
        }}
      />
    </Tabs>
  );
}
