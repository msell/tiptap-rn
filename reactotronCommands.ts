import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import Reactotron from "reactotron-react-native";

// Utility: SQLite DB file paths for Expo
const DB_FILE_NAMES = ["inky.db", "SQLite/inky.db"];

async function deleteDbFiles() {
  let deleted = [];
  let errors = [];
  for (const name of DB_FILE_NAMES) {
    // Try both root and SQLite subdir
    const paths = [
      `${FileSystem.documentDirectory}${name}`,
      `${FileSystem.cacheDirectory}${name}`,
      // Android: legacy path
      Platform.OS === "android" ? `/data/data/${name}` : undefined,
    ].filter(Boolean);
    for (const path of paths) {
      if (typeof path !== "string") continue;
      try {
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists) {
          await FileSystem.deleteAsync(path, { idempotent: true });
          deleted.push(path);
        }
      } catch (err) {
        errors.push({ path, err });
      }
    }
  }
  return { deleted, errors };
}

export function registerDbResetCommand() {
  Reactotron.onCustomCommand({
    command: "reset-db",
    title: "Reset SQLite DB",
    description: "Deletes all SQLite DB files for a fresh start.",
    handler: async () => {
      const { deleted, errors } = await deleteDbFiles();
      Reactotron.display({
        name: "SQLite Reset",
        value: { deleted, errors },
        preview: `Deleted ${deleted.length} DB files.`,
        important: true,
      });
    },
  });
}
