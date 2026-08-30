import React from "react";
import { Redirect } from "expo-router";

export default function LegacySavedLooksRedirect() {
  return <Redirect href="/(tabs)/saved" />;
}
