import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Calculadora.css'; // Importamos el CSS

function Calculadora() {
    const [libros, setLibros] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [pedido, setPedido] = useState([]);
    const [fotoHover, setFotoHover] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:3001/libros')
            .then(res => setLibros(res.data))
            .catch(err => console.error("Error al obtener libros:", err));
    }, []);

    const obtenerRutaImagen = (nombre) => {
        if (!nombre || nombre.trim() === "") return "/notfound.jpg";
        return nombre.toLowerCase().endsWith('.jpg') ? `/imagenes/${nombre}` : `/imagenes/${nombre}.jpg`;
    };

    const agregarAlPedido = (libro) => {
        const existe = pedido.find(item => item.id === libro.id);
        if (existe) {
            if (existe.cantidad < libro.stock) {
                setPedido(pedido.map(item => item.id === libro.id ? { ...item, cantidad: item.cantidad + 1 } : item));
            } else {
                alert(`Límite alcanzado: Solo hay ${libro.stock} unidades disponibles.`);
            }
        } else {
            setPedido([...pedido, { ...libro, cantidad: 1 }]);
        }
    };

    const cambiarCantidad = (id, cant, stockMax) => {
        const nuevaCant = isNaN(cant) ? 0 : Math.max(0, cant);
        if (nuevaCant > stockMax) {
            alert(`No puedes superar las ${stockMax} unidades disponibles.`);
            return;
        }
        setPedido(pedido.map(item => item.id === id ? { ...item, cantidad: nuevaCant } : item).filter(i => i.cantidad > 0));
    };

    const confirmarEnvio = () => {
        if (pedido.length === 0) return alert("¡El pedido está vacío, po!");
        if (window.confirm("¿Confirmar despacho? Esta acción descontará el stock de forma permanente.")) {
            axios.post('http://localhost:3001/confirmar-envio', pedido)
                .then(res => {
                    if (res.data.Status === "Success") {
                        alert("✅ Stock actualizado exitosamente.");
                        setPedido([]);
                        axios.get('http://localhost:3001/libros').then(res => setLibros(res.data));
                    }
                })
                .catch(err => alert("Fallo de conexión con el servidor."));
        }
    };

    const totales = pedido.reduce((acc, item) => ({
        precio: acc.precio + (Number(item.valor_neto) * item.cantidad),
        peso: acc.peso + (parseFloat(item.peso || 0) * item.cantidad)
    }), { precio: 0, peso: 0 });

    const filtrados = libros.filter(l => 
        (l.titulo.toLowerCase().includes(busqueda.toLowerCase()) || l.isbn.includes(busqueda)) &&
        l.stock > 0
    );

    return (
        <div className="calculadora-container">
            {/* ZOOM DE FOTO */}
            {fotoHover && (
                <div style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
                    <div className="calc-card" style={{ padding: '15px' }}>
                        <img src={obtenerRutaImagen(fotoHover)} style={{ width: '320px', borderRadius: '8px' }} onError={(e) => e.target.src = "/notfound.jpg"} />
                    </div>
                </div>
            )}

            <Link to="/inventario" className="btn-volver">← Volver al Inventario Técnico</Link>
            
            <div className="layout-calculadora">
                {/* SECCIÓN DE BÚSQUEDA */}
                <div className="seccion-busqueda">
                    <h2 className="titulo-logistica">🚚 Logística y Despacho</h2>
                    <input 
                        type="text" 
                        placeholder="Buscar por título, autor o ISBN..." 
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="input-busqueda-calc"
                    />
                    
                    <div className="calc-card scroll-busqueda">
                        {filtrados.length > 0 ? filtrados.map(l => (
                            <div key={l.id} className="item-busqueda">
                                <div className="info-libro-calc">
                                    <img 
                                        src={obtenerRutaImagen(l.imagen)} 
                                        className="img-calc"
                                        onMouseEnter={() => setFotoHover(l.imagen)}
                                        onMouseLeave={() => setFotoHover(null)}
                                        onError={(e) => e.target.src = "/notfound.jpg"}
                                    />
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '1.05em', color: '#34495e' }}>{l.titulo}</strong>
                                        <small style={{ color: '#7f8c8d' }}>
                                            {l.peso} kg | ${Number(l.valor_neto).toLocaleString('es-CL')} | 
                                            <span style={{ color: l.stock < 5 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}> Stock: {l.stock}</span>
                                        </small>
                                    </div>
                                </div>
                                <button onClick={() => agregarAlPedido(l)} className="btn-añadir">Añadir</button>
                            </div>
                        )) : <p style={{ textAlign: 'center', color: '#95a5a6' }}>No se encontraron unidades disponibles.</p>}
                    </div>
                </div>

                {/* RESUMEN DEL PEDIDO */}
                <div className="seccion-resumen">
                    <div className="calc-card">
                        <h3 className="resumen-titulo">📦 Resumen de Carga</h3>
                        
                        <div className="scroll-pedido">
                            {pedido.length === 0 ? <p style={{ color: '#bdc3c7', textAlign: 'center', margin: '30px 0' }}>El pedido está vacío.</p> : null}
                            {pedido.map(item => (
                                <div key={item.id} className="item-pedido-lista">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '70%' }}>
                                        <img src={obtenerRutaImagen(item.imagen)} style={{ width: '30px', borderRadius: '2px' }} onError={(e) => e.target.src = "/notfound.jpg"} />
                                        <span style={{ fontSize: '0.9em', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.titulo}</span>
                                    </div>
                                    <input 
                                        type="number" 
                                        value={item.cantidad} 
                                        onChange={(e) => cambiarCantidad(item.id, parseInt(e.target.value), item.stock)} 
                                        className="input-cantidad-calc"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="caja-totales">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', opacity: 0.9 }}>
                                <span>Peso Total:</span>
                                <strong>{totales.peso.toFixed(2)} kg</strong>
                            </div>
                            <div className="total-neto">
                                <span>Total Neto:</span>
                                <span>${totales.precio.toLocaleString('es-CL')}</span>
                            </div>
                        </div>

                        <button onClick={confirmarEnvio} className="btn-confirmar-envio">Confirmar y Descontar Stock</button>
                        <button onClick={() => setPedido([])} className="btn-vaciar">Vaciar Lista</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Calculadora;