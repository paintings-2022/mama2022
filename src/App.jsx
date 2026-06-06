import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Gallery from './Gallery';
import Admin from './Admin';

function App() {
  const [data, setData] = useState({ gallery: [] });

  useEffect(() => {
    // Fetch initial data
    fetch(`${import.meta.env.BASE_URL}data.json?t=${new Date().getTime()}`)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error("Failed to load data.json", err));
  }, []);

  const handleSaveData = async (newData) => {
    try {
      const response = await fetch('/api/saveData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newData)
      });
      const result = await response.json();
      if (result.success) {
        setData(newData);
        alert('Data saved successfully to local disk! Remember to commit and push to GitHub.');
      } else {
        alert('Failed to save data. Make sure you are running the local Vite dev server.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save data. This feature only works when running the local Vite dev server.');
    }
  };

  return (
    <>
      <header className="header glass">
        <h1><Link to="/">美淑畫廊</Link></h1>
      </header>

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Gallery data={data} onSave={handleSaveData} />} />
          <Route path="/admin" element={<Admin data={data} onSave={handleSaveData} />} />
        </Routes>
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <p>mama2022 Gallery v1.1 &copy; 2026</p>
      </footer>
    </>
  );
}

export default App;
