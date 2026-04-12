const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'rapanui_press'
});

db.connect((err) => {
    if (err) console.error('Error al conectar a la BDD:', err);
    else console.log('¡Conectado exitosamente a la BDD Rapanui Press!');
});

// --- RUTA: LOGIN ---
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM usuarios WHERE email = ? AND contraseña = ?";
    db.query(sql, [email, password], (err, result) => {
        if (err) return res.status(500).json({ Status: "Error" });
        if (result.length > 0) return res.json({ Status: "Success", Usuario: result[0].usuario });
        else return res.json({ Status: "Error", Message: "Correo o clave incorrectos" });
    });
});

// --- RUTA: OBTENER LIBROS ---
app.get('/libros', (req, res) => {
    const sql = "SELECT * FROM inventario";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ Status: "Error" });
        return res.json(result);
    });
});

// --- RUTA: ACTUALIZAR LIBRO ---
app.put('/actualizar-libro/:id', (req, res) => {
    const { id } = req.params;
    let { titulo, idioma, autor, isbn, valor_neto, genero, tipo, peso, medida, stock, imagen } = req.body;
    
    // Formateo automático de imagen
    if (imagen && !imagen.toLowerCase().endsWith('.jpg')) {
        imagen = imagen + '.jpg';
    }

    const sql = `UPDATE inventario SET 
        titulo=?, idioma=?, autor=?, isbn=?, valor_neto=?, 
        genero=?, tipo=?, peso=?, medida=?, stock=?, imagen=? 
        WHERE id=?`;
    const values = [titulo, idioma, autor, isbn, valor_neto, genero, tipo, peso, medida, stock, imagen, id];
    db.query(sql, values, (err) => {
        if (err) return res.status(500).json({ Status: "Error" });
        return res.json({ Status: "Success" });
    });
});

// --- RUTA: AGREGAR LIBRO ---
app.post('/agregar-libro', (req, res) => {
    let { titulo, idioma, autor, isbn, valor_neto, genero, tipo, peso, medida, stock, imagen } = req.body;
    
    if (imagen && !imagen.toLowerCase().endsWith('.jpg')) {
        imagen = imagen + '.jpg';
    }

    const sql = `INSERT INTO inventario 
        (titulo, idioma, autor, isbn, valor_neto, genero, tipo, peso, medida, stock, imagen) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [titulo, idioma, autor, isbn, valor_neto, genero, tipo, peso, medida, stock, imagen || ""];
    db.query(sql, values, (err) => {
        if (err) return res.status(500).json({ Status: "Error" });
        return res.json({ Status: "Success" });
    });
});

// --- RUTA: ELIMINAR LIBRO ---
app.delete('/eliminar-libro/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM inventario WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ Status: "Error" });
        return res.json({ Status: "Success" });
    });
});

// --- RUTA: CONFIRMAR ENVÍO Y DESCONTAR STOCK ---
app.post('/confirmar-envio', (req, res) => {
    const pedido = req.body; 

    // Mapeo de actualizaciones para asegurar integridad
    const promesas = pedido.map(item => {
        // Corregido: Se cambió 'libros' por 'inventario' para que coincida con tu BDD
        const sql = "UPDATE inventario SET stock = stock - ? WHERE id = ?";
        return new Promise((resolve, reject) => {
            db.query(sql, [item.cantidad, item.id], (err, result) => {
                if (err) {
                    console.error(`Error en ítem ID ${item.id}:`, err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    });

    Promise.all(promesas)
        .then(() => {
            console.log("Inventario actualizado tras despacho exitoso.");
            res.json({ Status: "Success" });
        })
        .catch(err => {
            console.error("Fallo general en la actualización de stock:", err);
            // Evita el 'undefined' enviando el mensaje de error real
            res.status(500).json({ Status: "Error", Message: err.message || "Error interno del servidor" });
        });
});

app.listen(3001, () => console.log('Servidor IMS Rapanui corriendo en puerto 3001'));