import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UploadForm from './components/UploadForm';
import ChatSearch from './components/ChatSearch';
import ItemList from './components/ItemList';
import './styles/App.css';

function App() {
  const [activeTab, setActiveTab] = useState('search');

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🎁 Family Gifting Registry</h1>
          <p className="tagline">AI-powered gift management for your family</p>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'search' ? 'active' : ''}
          onClick={() => setActiveTab('search')}
        >
          🔍 Search Gifts
        </button>
        <button
          className={activeTab === 'upload' ? 'active' : ''}
          onClick={() => setActiveTab('upload')}
        >
          📸 Upload Items
        </button>
        <button
          className={activeTab === 'browse' ? 'active' : ''}
          onClick={() => setActiveTab('browse')}
        >
          📦 Browse All
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'search' && <ChatSearch />}
        {activeTab === 'upload' && <UploadForm onUploadSuccess={() => setActiveTab('browse')} />}
        {activeTab === 'browse' && <ItemList />}
      </main>

      <footer className="app-footer">
        <p>Powered by Google Cloud Vision AI | Built with React & Node.js</p>
      </footer>
    </div>
  );
}

export default App;
