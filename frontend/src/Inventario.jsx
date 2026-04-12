import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Inventario.css'; 

// --- 1. COMPONENTE DEL CHATBOT (Definido fuera para no ensuciar) ---
const ChatbotBasico = ({ libros, calcularTotalBodega }) => {
    const [abierto, setAbierto] = useState(false);
    const [historial, setHistorial] = useState([
        { user: 'bot', text: '¡Hola! Soy tu asistente de Rapanui Press. ¿Qué necesitas revisar?' }
    ]);

    const responderAyuda = (tipo) => {
        let respuesta = "";
        if (tipo === 'stock') {
            const criticos = libros.filter(l => l.stock < 5);
            respuesta = criticos.length > 0 
                ? `Ojo: Hay ${criticos.length} libros con stock crítico (menos de 5 unidades).` 
                : "Todo impecable: No hay libros con stock bajo las 5 unidades.";
        } else if (tipo === 'valor') {
            respuesta = `La valorización actual de la bodega es de $${calcularTotalBodega().toLocaleString('es-CL')} Neto.`;
        }

        setHistorial([...historial, { user: 'bot', text: respuesta }]);
    };

    return (
        <div className="chatbot-wrapper">
            <button className="btn-chat-toggle" onClick={() => setAbierto(!abierto)}>
                {abierto ? '✖ Cerrar' : '💬 Asistente'}
            </button>
            
            {abierto && (
                <div className="chatbot-ventana">
                    <div className="chatbot-header">Asistente de Inventario</div>
                    <div className="chatbot-body">
                        {historial.map((msg, i) => (
                            <div key={i} className={`msg ${msg.user}`}>{msg.text}</div>
                        ))}
                    </div>
                    <div className="chatbot-footer">
                        <button onClick={() => responderAyuda('stock')}>¿Stock Crítico?</button>
                        <button onClick={() => responderAyuda('valor')}>¿Valor Bodega?</button>
                    </div>
                </div>
            )}
        </div>
    );
};

function Inventario() {
    const [libros, setLibros] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editandoLibro, setEditandoLibro] = useState(null);
    const [fotoHover, setFotoHover] = useState(null); 
    const [orden, setOrden] = useState({ columna: 'titulo', direccion: 'asc' });

    const [nuevoLibro, setNuevoLibro] = useState({
        titulo: "", imagen: "", idioma: "ESP", autor: "", isbn: "", 
        valor_neto: 0, genero: "", tipo: "ENSAYO", peso: "", medida: "", stock: 0
    });

    const cargarLibros = () => {
        axios.get('http://localhost:3001/libros')
            .then(res => setLibros(res.data))
            .catch(err => console.error("Error al cargar:", err));
    };

    useEffect(() => { cargarLibros(); }, []);

    const calcularTotalBodega = () => {
        return libros.reduce((acc, libro) => acc + (Number(libro.valor_neto) * Number(libro.stock)), 0);
    };

    const obtenerRutaImagen = (nombre) => {
        if (!nombre || nombre.trim() === "") return "/notfound.jpg";
        return nombre.toLowerCase().endsWith('.jpg') ? `/imagenes/${nombre}` : `/imagenes/${nombre}.jpg`;
    };

    const manejarOrden = (columna) => {
        const nuevaDireccion = orden.columna === columna && orden.direccion === 'asc' ? 'desc' : 'asc';
        setOrden({ columna, direccion: nuevaDireccion });
    };

    const eliminarLibro = (id, titulo) => {
        if (window.confirm(`⚠️ ¿Seguro que quieres borrar permanentemente "${titulo}"?`)) {
            axios.delete(`http://localhost:3001/eliminar-libro/${id}`).then(res => { 
                if (res.data.Status === "Success") cargarLibros(); 
            });
        }
    };

    const guardarCambios = (e) => {
        e.preventDefault();
        axios.put(`http://localhost:3001/actualizar-libro/${editandoLibro.id}`, editandoLibro)
            .then(res => { 
                if(res.data.Status === "Success") { 
                    setEditandoLibro(null); 
                    cargarLibros(); 
                } 
            });
    };

    const manejarEnvioLibro = (e) => {
        e.preventDefault();
        axios.post('http://localhost:3001/agregar-libro', nuevoLibro)
            .then(res => { if(res.data.Status === "Success") { setMostrarForm(false); cargarLibros(); } });
    };

    const librosProcesados = libros
        .filter(l => 
            l.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
            l.autor.toLowerCase().includes(busqueda.toLowerCase()) ||
            l.isbn.includes(busqueda)
        )
        .sort((a, b) => {
            let valA = a[orden.columna];
            let valB = b[orden.columna];
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
            if (valA < valB) return orden.direccion === 'asc' ? -1 : 1;
            if (valA > valB) return orden.direccion === 'asc' ? 1 : -1;
            return 0;
        });

    return (
        <div className="inventario-container">
            {/* ZOOM FOTO */}
            {fotoHover && (
                <div style={{ position: 'fixed', right: '50px', top: '150px', zIndex: 3000 }}>
                    <div className="inventario-card" style={{ padding: '10px' }}>
                        <img src={obtenerRutaImagen(fotoHover)} style={{ width: '280px', borderRadius: '8px' }} onError={(e) => e.target.src = "/notfound.jpg"} />
                    </div>
                </div>
            )}

            <header className="inventario-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <img src="/rapanui-press.jpg" alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '8px' }} />
                    <div>
                        <h1>IMS - Inventario</h1>
                        <p className="valorizacion-mini">
                            <strong>Valorización Total:</strong> <span className="valorizacion-monto">${calcularTotalBodega().toLocaleString('es-CL')} Neto</span>
                        </p>
                    </div>
                </div>
                <div className="btn-group">
                    <Link to="/calculadora"><button className="btn-nav btn-azul">🚚 Calculadora</button></Link>
                    <button onClick={() => setMostrarForm(true)} className="btn-nav btn-verde">➕ Nuevo Libro</button>
                    <button onClick={() => window.location.href = '/'} className="btn-nav btn-gris">Cerrar Sesión</button>
                </div>
            </header>

            <div className="inventario-card">
                <input type="text" className="input-busqueda" placeholder="Buscar por Título, Autor o ISBN..." onChange={(e) => setBusqueda(e.target.value)} />
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="inventario-tabla">
                    <thead>
                        <tr>
                            <th>Portada</th>
                            <th onClick={() => manejarOrden('titulo')} style={{ cursor: 'pointer' }}>
                                Título {orden.columna === 'titulo' ? (orden.direccion === 'asc' ? '🔼' : '🔽') : '↕️'}
                            </th>
                            <th onClick={() => manejarOrden('autor')} style={{ cursor: 'pointer' }}>
                                Autor {orden.columna === 'autor' ? (orden.direccion === 'asc' ? '🔼' : '🔽') : '↕️'}
                            </th>
                            <th>ISBN</th>
                            <th>Tipo/Género</th>
                            <th>Medida/Peso</th>
                            <th>Precio</th>
                            <th onClick={() => manejarOrden('stock')} style={{ textAlign: 'center', cursor: 'pointer' }}>
                                Stock {orden.columna === 'stock' ? (orden.direccion === 'asc' ? '🔼' : '🔽') : '↕️'}
                            </th>
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {librosProcesados.map((libro) => (
                            <tr key={libro.id}>
                                <td style={{textAlign:'center'}}><img className="img-portada" src={obtenerRutaImagen(libro.imagen)} onMouseEnter={() => setFotoHover(libro.imagen)} onMouseLeave={() => setFotoHover(null)} onError={(e) => e.target.src = "/notfound.jpg"} /></td>
                                <td style={{fontWeight:'bold'}}>{libro.titulo}</td>
                                <td>{libro.autor}</td>
                                <td style={{color:'#7f8c8d'}}>{libro.isbn}</td>
                                <td>{libro.tipo}<br/><small style={{color:'#95a5a6'}}>{libro.genero}</small></td>
                                <td>{libro.medida}<br/><small style={{color:'#95a5a6'}}>{libro.peso} kg</small></td>
                                <td style={{fontWeight:'600'}}>${Number(libro.valor_neto).toLocaleString('es-CL')}</td>
                                <td style={{textAlign:'center'}}>
                                    <span className={`stock-pill ${libro.stock < 5 ? 'stock-bajo' : 'stock-ok'}`}>{libro.stock}</span>
                                </td>
                                <td style={{textAlign:'center'}}>
                                    <button onClick={() => setEditandoLibro({...libro})} style={{border:'none', background:'none', cursor:'pointer', fontSize:'1.2em'}}>✏️</button>
                                    <button onClick={() => eliminarLibro(libro.id, libro.titulo)} style={{border:'none', background:'none', cursor:'pointer', fontSize:'1.2em'}}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODALES */}
            {mostrarForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{borderBottom:'2px solid #eee', paddingBottom:'15px'}}>Registrar Nuevo Libro</h3>
                        <form onSubmit={manejarEnvioLibro} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginTop:'20px'}}>
                            {Object.keys(nuevoLibro).map(campo => (
                                <div key={campo}>
                                    <label style={{fontSize:'0.8em', color:'#7f8c8d'}}>{campo.replace('_',' ')}</label>
                                    <input className="input-busqueda" type={campo==='stock'||campo==='valor_neto'?'number':'text'} onChange={e => setNuevoLibro({...nuevoLibro, [campo]: e.target.value})} />
                                </div>
                            ))}
                            <div style={{gridColumn:'span 3', display:'flex', gap:'10px', marginTop:'15px'}}>
                                <button type="submit" className="btn-nav btn-verde" style={{flex:1}}>Guardar</button>
                                <button type="button" onClick={()=>setMostrarForm(false)} className="btn-nav btn-gris" style={{flex:1, backgroundColor:'#e74c3c'}}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editandoLibro && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{borderBottom:'2px solid #eee', paddingBottom:'15px'}}>✏️ Editando: {editandoLibro.titulo}</h3>
                        <form onSubmit={guardarCambios} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginTop:'20px'}}>
                            {Object.keys(nuevoLibro).map(campo => (
                                <div key={campo}>
                                    <label style={{fontSize:'0.8em', color:'#7f8c8d'}}>{campo.replace('_',' ')}</label>
                                    <input 
                                        className="input-busqueda" 
                                        type={campo==='stock'||campo==='valor_neto'?'number':'text'} 
                                        value={editandoLibro[campo]} 
                                        onChange={e => setEditandoLibro({...editandoLibro, [campo]: e.target.value})} 
                                    />
                                </div>
                            ))}
                            <div style={{gridColumn:'span 3', display:'flex', gap:'10px', marginTop:'15px'}}>
                                <button type="submit" className="btn-nav btn-azul" style={{flex:1}}>Actualizar Cambios</button>
                                <button type="button" onClick={()=>setEditandoLibro(null)} className="btn-nav btn-gris" style={{flex:1}}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- LLAMADA AL CHATBOT --- */}
            <ChatbotBasico libros={libros} calcularTotalBodega={calcularTotalBodega} />

        </div>
    );
}
export default Inventario;