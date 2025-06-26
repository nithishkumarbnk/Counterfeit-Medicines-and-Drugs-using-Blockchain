// frontend/src/components/MedicineList.js

import React, { useState, useEffect } from 'react';

function MedicineList() {
  const [medicineIds, setMedicineIds] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [message, setMessage] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const fetchMedicineIds = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/medicines' );
      const data = await response.json();
      if (response.ok) {
        setMedicineIds(data);
      } else {
        setMessage(`Error fetching IDs: ${data.error}`);
      }
    } catch (error) {
      console.error('Error fetching medicine IDs:', error);
      setMessage('Network error or backend server is not running.');
    }
  };

  const fetchMedicineDetails = async (id) => {
    setMessage('');
    try {
      const response = await fetch(`http://localhost:5000/api/medicines/${id}` );
      const data = await response.json();
      if (response.ok) {
        setSelectedMedicine(data);
        setNewStatus(data.status); // Pre-fill update form
        setNewLocation(data.currentLocation); // Pre-fill update form
      } else {
        setMessage(`Error fetching details: ${data.error}`);
        setSelectedMedicine(null);
      }
    } catch (error) {
      console.error('Error fetching medicine details:', error);
      setMessage('Network error or backend server is not running.');
      setSelectedMedicine(null);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedMedicine) return;
    setMessage('');

    try {
      const response = await fetch(`http://localhost:5000/api/medicines/${selectedMedicine.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newStatus, newLocation } ),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Success: ${data.message} Transaction: ${data.transactionHash}`);
        fetchMedicineDetails(selectedMedicine.id); // Refresh details
        fetchMedicineIds(); // Refresh IDs in case owner changed
      } else {
        setMessage(`Error: ${data.error || 'Failed to update status.'}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage('Network error or server is not running.');
    }
  };

  useEffect(() => {
    fetchMedicineIds();
    const interval = setInterval(fetchMedicineIds, 5000); // Refresh IDs every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h3>Available Medicine IDs:</h3>
      {message && <p style={{ color: 'red' }}>{message}</p>}
      <ul>
        {medicineIds.length === 0 ? (
          <p>No medicines tracked yet. Add one above!</p>
        ) : (
          medicineIds.map((id) => (
            <li key={id}>
              <button onClick={() => fetchMedicineDetails(id)}>{id}</button>
            </li>
          ))
        )}
      </ul>

      {selectedMedicine && (
        <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
          <h3>Details for ID: {selectedMedicine.id}</h3>
          <p><strong>Name:</strong> {selectedMedicine.name}</p>
          <p><strong>Manufacturer:</strong> {selectedMedicine.manufacturer}</p>
          <p><strong>Manufacture Date:</strong> {new Date(selectedMedicine.manufactureDate * 1000).toLocaleDateString()}</p>
          <p><strong>Current Location:</strong> {selectedMedicine.currentLocation}</p>
          <p><strong>Status:</strong> {selectedMedicine.status}</p>
          <p><strong>Current Owner:</strong> {selectedMedicine.owner}</p>
          <p><strong>Last Updated:</strong> {new Date(selectedMedicine.timestamp * 1000).toLocaleString()}</p>

          <h4>Update Status:</h4>
          <form onSubmit={handleUpdateStatus}>
            <div>
              <label>New Status:</label>
              <input type="text" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} required />
            </div>
            <div>
              <label>New Location:</label>
              <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} required />
            </div>
            <button type="submit">Update Medicine</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default MedicineList;

