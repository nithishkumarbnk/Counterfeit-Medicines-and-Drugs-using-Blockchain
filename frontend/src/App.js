import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import DrugManufacturer from "./components/DrugManufacturer";
import DrugTransfer from "./components/DrugTransfer";
import DrugVerifier from "./components/DrugVerifier";
import "./App.css"; // For basic styling

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Anti-Counterfeit Drug System</h1>
          <nav>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <li style={{ margin: "0 15px" }}>
                <Link to="/" style={{ color: "white", textDecoration: "none" }}>
                  Verify Drug
                </Link>
              </li>
              <li style={{ margin: "0 15px" }}>
                <Link
                  to="/manufacture"
                  style={{ color: "white", textDecoration: "none" }}
                >
                  Manufacture
                </Link>
              </li>
              <li style={{ margin: "0 15px" }}>
                <Link
                  to="/transfer"
                  style={{ color: "white", textDecoration: "none" }}
                >
                  Transfer
                </Link>
              </li>
            </ul>
          </nav>
        </header>
        <main
          style={{
            padding: "20px",
            maxWidth: "800px",
            margin: "20px auto",
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <Routes>
            <Route path="/" element={<DrugVerifier />} />
            <Route path="/manufacture" element={<DrugManufacturer />} />
            <Route path="/transfer" element={<DrugTransfer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
