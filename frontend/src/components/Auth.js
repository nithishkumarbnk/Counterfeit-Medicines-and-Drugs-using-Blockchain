// frontend/src/components/Auth.js

import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // For Firestore
import { auth, db } from "../firebase"; // Your Firebase initialization

// Auth component now receives currentUser and userRole as props from App.js
function Auth({ currentUser, userRole }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // After successful signup, set a default role in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: userCredential.user.email,
        role: "pending", // Admin will change this later
        createdAt: new Date(),
      });
      setMessage(
        "Signed up successfully! Please wait for admin to assign your role."
      );
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage(`Error signing up: ${error.message}`);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Signed in successfully!");
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage(`Error signing in: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    setMessage("");
    try {
      await signOut(auth);
      setMessage("Signed out successfully.");
    } catch (error) {
      setMessage(`Error signing out: ${error.message}`);
    }
  };

  return (
    <div>
      {!currentUser ? ( // Use currentUser prop for conditional rendering
        <>
          <h2>Sign Up / Sign In</h2>
          <form onSubmit={handleSignIn}>
            {" "}
            {/* Default to sign in */}
            <div>
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Sign In</button>
            <button type="button" onClick={handleSignUp}>
              Sign Up
            </button>
          </form>
        </>
      ) : (
        <div>
          <p>Welcome, {currentUser.email}!</p>
          <p>Your role: {userRole}</p> {/* Use userRole prop for display */}
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}

export default Auth;
