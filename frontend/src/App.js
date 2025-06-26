// frontend/src/App.js

import React from 'react';
import MedicineList from './components/MedicineList';
import AddMedicine from './components/AddMedicine';
import './App.css'; // You can add some basic styling here

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Counterfeit Medicine Tracker</h1>
      </header>
      <main>
        <section className="add-medicine-section">
          <h2>Add New Medicine</h2>
          <AddMedicine />
        </section>
        <section className="medicine-list-section">
          <h2>Tracked Medicines</h2>
          <MedicineList />
        </section>
      </main>
    </div>
  );
}

export default App;

