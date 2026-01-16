import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
	apiKey: "AIzaSyAQ7I_FVZcZBMgORqPn32wZ8jQUAklrAnA",
	authDomain: "gray-and-blue.firebaseapp.com",
	databaseURL:
		"https://gray-and-blue-default-rtdb.asia-southeast1.firebasedatabase.app",
	projectId: "gray-and-blue",
	storageBucket: "gray-and-blue.firebasestorage.app",
	messagingSenderId: "148771683257",
	appId: "1:148771683257:web:11cb0bc3265193b0a1d468",
	measurementId: "G-T7XWX9SPLV",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

// Google OAuth 설정 최적화
provider.addScope("email");
provider.addScope("profile");

export { app, auth, provider, db, storage };
