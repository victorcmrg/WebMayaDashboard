import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import './ChatAdmin.css';

/* ============================================================
   SISTEMA DE TOAST NOTIFICATIONS
   ============================================================ */
const ToastItem = ({ id, message, type, onRemove }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleProgressEnd = () => {
    setIsClosing(true);
    setTimeout(() => onRemove(id), 300);
  };

  return (
    <div
      className={`maya-toast ${type} ${isClosing ? 'closing' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="maya-toast-content">{message}</div>
      <div
        className="maya-toast-progress"
        style={{ animationPlayState: isHovered ? 'paused' : 'running' }}
        onAnimationEnd={handleProgressEnd}
      />
    </div>
  );
};

/* ============================================================
   COMPONENTE PRINCIPAL DE CHAT
   ============================================================ */
const ChatAdmin = () => {
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef(null);

  // Estado dos Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const newToast = { id: Date.now() + Math.random(), message, type };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    const chatsRef = ref(db, 'chats');
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ticketsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setTickets(ticketsArray.sort((a, b) => b.id.localeCompare(a.id)));
      } else {
        setTickets([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTicketId) {
      const ticketRef = ref(db, `chats/${activeTicketId}`);
      update(ticketRef, { naoLidasAdmin: 0 });
      setShowInfo(false);
    }
  }, [activeTicketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicketId, tickets]);

  const handleEnviarMensagem = async (e) => {
    e.preventDefault();
    if (!mensagem.trim() || !activeTicketId) return;

    try {
      const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const novaMensagemRef = push(ref(db, `chats/${activeTicketId}/mensagens`));

      await set(novaMensagemRef, {
        remetente: 'admin',
        texto: mensagem,
        horario: horaAtual
      });

      const ticketAtivo = tickets.find(t => t.id === activeTicketId);
      if (ticketAtivo) {
        const naoLidasPac = (ticketAtivo.naoLidasPaciente || 0) + 1;
        await update(ref(db, `chats/${activeTicketId}`), { naoLidasPaciente: naoLidasPac });
      }

      setMensagem('');
    } catch (err) {
      showToast('Erro ao enviar mensagem.', 'error');
    }
  };

  const handleDeletarTicket = async (ticketId, e) => {
    e.stopPropagation();
    
    // Popup simples de confirmação nativo
    if (!window.confirm('Tem certeza que deseja apagar este chat permanentemente? Esta ação não pode ser desfeita.')) return;
    
    try {
      await remove(ref(db, `chats/${ticketId}`));
      if (activeTicketId === ticketId) setActiveTicketId(null);
      showToast('Chat deletado com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao deletar chat.', 'error');
    }
  };

  const activeTicket = tickets.find(t => t.id === activeTicketId);
  const mensagensArray = activeTicket?.mensagens ? Object.values(activeTicket.mensagens) : [];

  return (
    <div className="page-content">
      
      {/* CONTAINER DE TOASTS */}
      <div className="maya-toast-container">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onRemove={removeToast}
          />
        ))}
      </div>

      <div className="chat-wrapper shadow-container">

        {/* Painel Esquerdo (Lista de Chats) */}
        <div className="chat-sidebar">
          <div className="chat-header">
            <h3>Atendimentos</h3>
            <span className="chat-count">{tickets.length} abertos</span>
          </div>
          <div className="ticket-list">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className={`ticket-item ${activeTicketId === ticket.id ? 'active' : ''}`}
                onClick={() => setActiveTicketId(ticket.id)}
              >
                <div className="ticket-info">
                  <h4>{ticket.titulo}</h4>
                  <span className="ticket-paciente">
                    👤 {ticket.pacienteNome || 'Paciente desconhecido'}
                  </span>
                  <span>Aberto em: {ticket.data}</span>
                </div>
                
                {/* Ações do Chat (Badge e Lixeira Visível) */}
                <div className="ticket-actions">
                  {ticket.naoLidasAdmin > 0 && (
                    <div className="badge">{ticket.naoLidasAdmin}</div>
                  )}
                  <button
                    className="btn-deletar-ticket"
                    onClick={(e) => handleDeletarTicket(ticket.id, e)}
                    title="Apagar chat"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {tickets.length === 0 && <p className="empty-text">Nenhum chat aberto.</p>}
          </div>
        </div>

        {/* Painel Direito (Mensagens) */}
        <div className="chat-main">
          {activeTicketId ? (
            <>
              <div className="chat-header main">
                <div className="chat-header-info">
                  <h3>{activeTicket?.titulo}</h3>
                  <span className="chat-header-paciente">
                    {activeTicket?.pacienteNome || 'Paciente desconhecido'}
                  </span>
                </div>
                <button
                  className="btn-info-toggle"
                  onClick={() => setShowInfo(v => !v)}
                  title="Ver dados do paciente"
                >
                  ℹ️ Info
                </button>
              </div>

              {/* Painel de informações do paciente */}
              {showInfo && (
                <div className="paciente-info-panel">
                  <h4>Dados do Paciente</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Nome</span>
                      <span className="info-value">{activeTicket?.pacienteNome || '—'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">E-mail</span>
                      <span className="info-value">{activeTicket?.pacienteEmail || '—'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">ID</span>
                      <span className="info-value">{activeTicket?.pacienteId || '—'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Chat aberto em</span>
                      <span className="info-value">{activeTicket?.data || '—'}</span>
                    </div>
                  </div>
                  <button
                    className="btn-deletar-chat-panel"
                    onClick={(e) => handleDeletarTicket(activeTicketId, e)}
                  >
                    🗑 Apagar este chat permanentemente
                  </button>
                </div>
              )}

              <div className="messages-area">
                {mensagensArray.map((msg, index) => (
                  <div key={index} className={`message-bubble ${msg.remetente === 'admin' ? 'admin' : 'paciente'}`}>
                    <p>{msg.texto}</p>
                    <span className="time">{msg.horario}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-form" onSubmit={handleEnviarMensagem}>
                <input
                  type="text"
                  className="input-shadow"
                  placeholder="Digite sua resposta..."
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                />
                <button type="submit" className="btn-submit-chat">Enviar</button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <img src="/logo_maya.png" alt="Maya" style={{ width: 100, opacity: 0.2, marginBottom: 20 }} />
              <h3>Selecione um chat na lista ao lado para iniciar</h3>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatAdmin;