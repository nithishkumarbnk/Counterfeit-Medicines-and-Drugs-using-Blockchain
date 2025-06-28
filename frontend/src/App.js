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
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // State to hold user role

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser); // Set the Firebase user object
      if (firebaseUser) {
        // If a user is logged in, fetch their role from Firestore
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().role);
          } else {
            // This case should ideally not happen if signup creates the doc
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
        // If no user is logged in, clear the user and role
        setUser(null);
        setUserRole(null);
      }
    });
    return () => unsubscribe(); // Cleanup subscription on component unmount
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <div className="App">
      {/* ... (header and main sections) */}
      <main>
        <Auth currentUser={user} userRole={userRole} />

        {user && userRole && (
          <>
            {/* Conditional rendering for Add Medicine based on role */}
            {(userRole === "manufacturer" || userRole === "admin") && (
              <section className="add-medicine-section">
                <h2>Add New Medicine</h2>
                <AddMedicine userRole={userRole} />{" "}
                {/* Pass role to AddMedicine */}
              </section>
            )}

            {/* Medicine List is visible to all logged-in users with a role */}
            <section className="medicine-list-section">
              <h2>Tracked Medicines</h2>
              <MedicineList userRole={userRole} />{" "}
              {/* Pass role to MedicineList */}
            </section>

            {/* Optional: Admin Panel - UNCOMMENT THIS SECTION */}
            {userRole === "admin" && ( // Only render if userRole is 'admin'
              <section className="admin-panel-section">
                <h2>Admin Panel</h2>
                <AdminPanel userRole={userRole} />{" "}
                {/* Pass userRole to AdminPanel */}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
