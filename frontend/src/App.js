// frontend/src/App.js

import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import MedicineList from "./components/MedicineList";
import AddMedicine from "./components/AddMedicine";
import AdminPanel from "./components/AdminPanel";
import "./App.css";

import { auth, db } from "./firebase"; // Import auth and db from your firebase.js
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions

function App() {
  const [user, setUser] = useState(null); // Firebase user object
  const [userRole, setUserRole] = useState(null); // Role from Firestore
  const [firebaseIdToken, setFirebaseIdToken] = useState(null); // Firebase ID Token

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser); // Set the Firebase user object
      if (firebaseUser) {
        // Get the Firebase ID token
        const token = await firebaseUser.getIdToken();
        setFirebaseIdToken(token);

        // Fetch user's role from Firestore
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().role);
          } else {
            console.warn(
              "User document not found in Firestore for UID:",
              firebaseUser.uid
            );
            setUserRole("consumer"); // Default to consumer if doc missing
          }
        } catch (error) {
          console.error("Error fetching user role from Firestore:", error);
          setUserRole("consumer"); // Fallback in case of error
        }
      } else {
        // If no user is logged in, clear all user-related states
        setUser(null);
        setUserRole(null);
        setFirebaseIdToken(null);
      }
    });
    return () => unsubscribe(); // Cleanup subscription on component unmount
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Counterfeit Medicine Tracker</h1>
      </header>
      <main>
        {/* Auth component now receives user and userRole for display */}
        <Auth currentUser={user} userRole={userRole} />

        {/* Conditional rendering: Only show sections if user is logged in AND role is determined */}
        {user &&
          userRole &&
          firebaseIdToken && ( // Ensure token is also available
            <>
              {/* Conditional rendering for Add Medicine based on role */}
              {(userRole === "manufacturer" || userRole === "admin") && (
                <section className="add-medicine-section">
                  <h2>Add New Medicine</h2>
                  <AddMedicine
                    firebaseIdToken={firebaseIdToken}
                    userRole={userRole}
                  />
                </section>
              )}

              {/* Medicine List is visible to all logged-in users with a role */}
              <section className="medicine-list-section">
                <h2>Tracked Medicines</h2>
                <MedicineList
                  firebaseIdToken={firebaseIdToken}
                  userRole={userRole}
                />
              </section>

              {/* Admin Panel, visible only to admin */}
              {userRole === "admin" && (
                <section className="admin-panel-section">
                  <h2>Admin Panel</h2>
                  <AdminPanel firebaseIdToken={firebaseIdToken} />
                </section>
              )}
            </>
          )}
      </main>
    </div>
  );
}

export default App;
