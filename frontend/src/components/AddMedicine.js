// frontend/src/components/AddMedicine.js

import React, { useState } from 'react';

function AddMedicine() {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages

    try {
      const response = await fetch('http://localhost:5000/api/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, name, manufacturer, currentLocation: location } ),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Success: ${data.message} Transaction: ${data.transactionHash}`);
        setId('');
        setName('');
        setManufacturer('');
        setLocation('');
      } else {
        setMessage(`Error: ${data.error || 'Failed to add medicine.'}`);
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      setMessage('Network error or server is not running.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>ID:</label>
        <input type="text" value={id} onChange={(e) => setId(e.target.value)} required />
      </div>
      <div>
        <label>Name:</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label>Manufacturer:</label>
        <input type="text" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} required />
      </div>
      <div>
        <label>Current Location:</label>
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
      </div>
      <button type="submit">Add Medicine</button>
      {message && <p>{message}</p>}
    </form>
  );
}

export default AddMedicine;

