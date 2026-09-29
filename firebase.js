import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCEByUdGtaPgy7ACpp643PM9WevKY7sp4Y",
  authDomain: "://firebaseapp.com",
  databaseURL: "https://firebaseio.com",
  projectId: "projpwiii-45e67",
  storageBucket: "projpwiii-45e67.firebasestorage.app",
  messagingSenderId: "11074722212",
  appId: "1:11074722212:web:3bcd3eb63ee55500624931",
  measurementId: "G-XV17PGNYRY"
};

const app = initializeApp(firebaseConfig);

const persistenceMode = Platform.OS === 'web'
  ? browserLocalPersistence
  : getReactNativePersistence(AsyncStorage);

const auth = initializeAuth(app, {
  persistence: persistenceMode,
});

const database = getDatabase(app);

export { auth, database };
