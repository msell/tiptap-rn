import Reactotron from "reactotron-react-native";
import { registerDbResetCommand } from "./reactotronCommands";

const reactotron = Reactotron.configure({
  name: "Inky",
}) // controls connection & communication settings
  .useReactNative(); // add all built-in react native plugins

// Register custom command to reset SQLite DB
registerDbResetCommand();

console.tron = reactotron;

/**
 * We tell typescript about our dark magic
 *
 * You can also import Reactotron yourself from ./reactotronClient
 * and use it directly, like Reactotron.log('hello world')
 */
declare global {
  interface Console {
    /**
     * Reactotron client for logging, displaying, measuring performance, and more.
     * @see https://github.com/infinitered/reactotron
     * @example
     * if (__DEV__) {
     *  console.tron.display({
     *    name: 'JOKE',
     *    preview: 'What's the best thing about Switzerland?',
     *    value: 'I don't know, but the flag is a big plus!',
     *    important: true
     *  })
     * }
     */
    tron: typeof reactotron;
  }
}

/**
 * Now that we've setup all our Reactotron configuration, let's connect!
 */
reactotron.connect();
