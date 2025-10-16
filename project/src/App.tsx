import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import RegisterPage from './components/register';
import { ChatContainer } from './components/ChatContainer';
import { ChatGPTInterface } from './components/ChatGPTInterface';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* <Route path="/chat" element={<ChatContainer />} /> */}
      <Route path="/chatgpt" element={<ChatGPTInterface />} />
    </Routes>
  );
};

export default App;
