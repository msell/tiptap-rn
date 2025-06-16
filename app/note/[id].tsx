import { Text } from "@/components/nativewindui/Text";
import React from "react";
import { SafeAreaView, View } from "react-native";

// Main App Component
export default function Index(): React.ReactElement {

  return (
    <SafeAreaView className="flex-1 bg-gray-50">

        <View className="flex-1">
          <Text>Note Editor</Text>
        </View>

    </SafeAreaView>
  );
}