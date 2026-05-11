import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import logoMaya from './logo_maya.png'; // <-- Altere a extensão aqui se necessário (.jpg, .svg)

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logoMaya} alt="Logo Maya" className="sidebar-logo" />
      </div>

      <ul className="nav-menu">
        <li>
          <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
            Prescrições / Treinos
          </Link>
        </li>
        <li>
          <Link
            to="/banco-exercicios"
            className={`nav-item ${isActive('/banco-exercicios') ? 'active' : ''}`}
          >
            Banco de Exercícios
          </Link>
        </li>
        <li>
          <Link
            to="/cadastrar-paciente"
            className={`nav-item ${isActive('/cadastrar-paciente') ? 'active' : ''}`}
          >
            Cadastrar Paciente
          </Link>
        </li>
        <li>
          <Link
            to="/agendamentos"
            className={`nav-item ${isActive('/agendamentos') ? 'active' : ''}`}
          >
            Agendamentos
          </Link>
        </li>
        <li>
          <Link to="/chat" className={`nav-item ${isActive('/chat') ? 'active' : ''}`}>
            Atendimento / Chat
          </Link>
        </li>
      </ul>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;