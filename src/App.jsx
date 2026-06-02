import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Gallery from './Gallery';
import Admin from './Admin';

function App() {
  const [data, setData] = useState({ gallery: [] });

  useEffect(() => {
    // Fetch initial data
    fetch('/data.json')
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
        <h1><Link to="/">My Gallery</Link></h1>
        <nav>
          <Link to="/admin" className="nav-link">Admin</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Gallery data={data} />} />
          <Route path="/admin" element={<Admin data={data} onSave={handleSaveData} />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
