import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Inventario from './Inventario'; 
import Calculadora from './Calculadora';
import './App.css'; 

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:3001/login', { email, password })
      .then(res => {
        if (res.data.Status === "Success") {
          navigate('/inventario');
        } else {
          alert(res.data.Message);
        }
      })
      .catch(err => {
        alert("Servidor no disponible. Revisa la conexión con el backend.");
      });
  };

  return (
    <div className="login-container">
      {/* LOGO DE LA EDITORIAL */}
      <img 
        src="/rapanui-press.jpg" 
        alt="Logo Rapanui Press" 
        className="login-logo"
      />
      
      <h1 className="login-title">IMS - Rapanui Press</h1>
      
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label>Correo Electrónico</label>
          <input 
            type="email" 
            placeholder="ejemplo@correo.com"
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="input-login"
          />
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input 
            type="password" 
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="input-login"
          />
        </div>

        <button type="submit" className="btn-login">Ingresar al Sistema</button>
      </form>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/calculadora" element={<Calculadora />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;