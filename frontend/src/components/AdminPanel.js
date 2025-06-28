// frontend/src/components/AdminPanel.js
import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

function AdminPanel({ userRole }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (userRole === "admin") {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    const usersCol = collection(db, "users");
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUsers(userList);
  };

  const handleRoleChange = async (userId, newRole) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { role: newRole });
    fetchUsers(); // Refresh list
  };

  if (userRole !== "admin") {
    return <p>Access Denied. Only admins can view this panel.</p>;
  }

  return (
    <div>
      <h2>Admin Panel - Manage User Roles</h2>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Current Role</th>
            <th>Change Role To</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="consumer">Consumer</option>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="distributor">Distributor</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <button onClick={() => handleRoleChange(user.id, user.role)}>
                  Update
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPanel;
