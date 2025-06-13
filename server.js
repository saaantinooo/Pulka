// server.js - Servidor Node.js con Express
const express = require('express');
const mysql = require('mysql2/promise'); // Usamos mysql2/promise para async/await
const cors = require('cors'); // Para permitir peticiones de orígenes cruzados
const bodyParser = require('body-parser'); // Para parsear el cuerpo de las peticiones JSON

const app = express();
const PORT = 3000; // Puerto donde correrá tu API

// Middleware
app.use(cors()); // Permite que tu frontend (ej. localhost:80) acceda a esta API (localhost:3000)
app.use(bodyParser.json()); // Para parsear application/json
app.use(bodyParser.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// Configuración de la base de datos
const dbConfig = {
    host: 'localhost',
    user: 'root',              // <<-- CAMBIA POR TU USUARIO DE MySQL
    password: '',              // <<-- CAMBIA POR TU CONTRASEÑA DE MySQL
    database: 'booking_app',   // <<-- CAMBIA POR EL NOMBRE DE TU BASE DE DATOS
    charset: 'utf8mb4'
};

// Conexión a la base de datos
let db;

async function conectarDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Conectado a la base de datos MySQL');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        // Si hay un error al conectar, salimos de la aplicación
        process.exit(1);
    }
}

// Rutas de la API

// GET /api/paquetes - Obtener todos los paquetes con sus servicios adicionales
app.get('/api/paquetes', async (req, res) => {
    try {
        // Consulta para obtener paquetes y sus servicios adicionales agrupados
        const [paquetes] = await db.execute(`
            SELECT p.ID_Paquete, p.Nombre, p.Destino, p.Descripcion, p.Precio_Base, p.Disponible,
                   GROUP_CONCAT(
                       CONCAT(s.ID_Servicio, ':', s.Tipo, ':', s.Descripcion, ':', s.Precio)
                       ORDER BY s.ID_Servicio SEPARATOR '|'
                   ) as servicios
            FROM paquete_turistico p
            LEFT JOIN servicio_adicional s ON p.ID_Paquete = s.ID_Paquete
            WHERE p.Disponible = 1
            GROUP BY p.ID_Paquete
            ORDER BY p.ID_Paquete
        `);

        // Procesar los resultados para incluir servicios en un array de objetos
        const paquetesConServicios = paquetes.map(paquete => {
            const serviciosAdicionales = [];
            
            if (paquete.servicios) {
                const servicios = paquete.servicios.split('|');
                servicios.forEach(servicioStr => {
                    const [id, tipo, descripcion, precio] = servicioStr.split(':');
                    if (id && tipo && descripcion && precio) { // Asegurarse de que todos los componentes existen
                        serviciosAdicionales.push({
                            id: parseInt(id),
                            tipo,
                            descripcion,
                            precio: parseFloat(precio)
                        });
                    }
                });
            }

            return {
                id: paquete.ID_Paquete,
                nombre: paquete.Nombre,
                destino: paquete.Destino,
                descripcion: paquete.Descripcion,
                precio_base: parseFloat(paquete.Precio_Base), // Asegurarse de que sea un número
                disponible: paquete.Disponible === 1,
                servicios_adicionales: serviciosAdicionales
            };
        });

        res.json(paquetesConServicios);
    } catch (error) {
        console.error('Error al obtener paquetes:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener paquetes' });
    }
});

// GET /api/paquete/:id - Obtener un paquete específico con sus servicios
app.get('/api/paquete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener detalles del paquete
        const [paquetes] = await db.execute(
            'SELECT ID_Paquete, Nombre, Destino, Descripcion, Precio_Base, Disponible FROM paquete_turistico WHERE ID_Paquete = ? AND Disponible = 1',
            [id]
        );

        if (paquetes.length === 0) {
            return res.status(404).json({ error: 'Paquete no encontrado o no disponible' });
        }

        const paquete = paquetes[0];

        // Obtener servicios adicionales para este paquete
        const [servicios] = await db.execute(
            'SELECT ID_Servicio, Tipo, Descripcion, Precio FROM servicio_adicional WHERE ID_Paquete = ?',
            [id]
        );

        const serviciosAdicionales = servicios.map(servicio => ({
            id: servicio.ID_Servicio,
            tipo: servicio.Tipo,
            descripcion: servicio.Descripcion,
            precio: parseFloat(servicio.Precio)
        }));

        const resultado = {
            id: paquete.ID_Paquete,
            nombre: paquete.Nombre,
            destino: paquete.Destino,
            descripcion: paquete.Descripcion,
            precio_base: parseFloat(paquete.Precio_Base),
            disponible: paquete.Disponible === 1,
            servicios_adicionales: serviciosAdicionales
        };

        res.json(resultado);
    } catch (error) {
        console.error('Error al obtener paquete específico:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener paquete' });
    }
});

// GET /api/buscar?q=query - Buscar paquetes por nombre, destino o descripción
app.get('/api/buscar', async (req, res) => {
    try {
        const { q } = req.query; // q es el parámetro de búsqueda

        if (!q || q.trim() === '') {
            return res.status(400).json({ error: 'Parámetro de búsqueda "q" requerido' });
        }

        const searchTerm = `%${q}%`; // Para búsquedas con LIKE

        // Consulta de búsqueda con LEFT JOIN para incluir servicios
        const [paquetes] = await db.execute(`
            SELECT p.ID_Paquete, p.Nombre, p.Destino, p.Descripcion, p.Precio_Base, p.Disponible,
                   GROUP_CONCAT(
                       CONCAT(s.ID_Servicio, ':', s.Tipo, ':', s.Descripcion, ':', s.Precio)
                       ORDER BY s.ID_Servicio SEPARATOR '|'
                   ) as servicios
            FROM paquete_turistico p
            LEFT JOIN servicio_adicional s ON p.ID_Paquete = s.ID_Paquete
            WHERE p.Disponible = 1
            AND (p.Nombre LIKE ? OR p.Destino LIKE ? OR p.Descripcion LIKE ?)
            GROUP BY p.ID_Paquete
            ORDER BY p.ID_Paquete
        `, [searchTerm, searchTerm, searchTerm]);

        const paquetesConServicios = paquetes.map(paquete => {
            const serviciosAdicionales = [];
            
            if (paquete.servicios) {
                const servicios = paquete.servicios.split('|');
                servicios.forEach(servicioStr => {
                    const [id, tipo, descripcion, precio] = servicioStr.split(':');
                    if (id && tipo && descripcion && precio) {
                        serviciosAdicionales.push({
                            id: parseInt(id),
                            tipo,
                            descripcion,
                            precio: parseFloat(precio)
                        });
                    }
                });
            }

            return {
                id: paquete.ID_Paquete,
                nombre: paquete.Nombre,
                destino: paquete.Destino,
                descripcion: paquete.Descripcion,
                precio_base: parseFloat(paquete.Precio_Base),
                disponible: paquete.Disponible === 1,
                servicios_adicionales: serviciosAdicionales
            };
        });

        res.json(paquetesConServicios);
    } catch (error) {
        console.error('Error al buscar paquetes:', error);
        res.status(500).json({ error: 'Error interno del servidor al buscar paquetes' });
    }
});

// POST /api/reservar - Crear una reserva utilizando el procedimiento almacenado
app.post('/api/reservar', async (req, res) => {
    try {
        // Extrae los datos del cuerpo de la petición
        const { id_usuario, id_paquete, servicios_adicionales = [] } = req.body;

        // Validación básica de los datos
        if (!id_usuario || !id_paquete) {
            return res.status(400).json({ success: false, message: 'ID de usuario y ID de paquete son requeridos.' });
        }

        // Convierte el array de IDs de servicios a una cadena separada por comas
        // El procedimiento almacenado espera '1,2,5' para p_Servicios
        const serviciosStr = servicios_adicionales.join(',');

        // Llama al procedimiento almacenado "CrearReservaConServicios"
        // Los parámetros se pasan en el orden definido en el procedimiento: p_ID_Usuario, p_ID_Paquete, p_Servicios
        const [result] = await db.execute(
            'CALL CrearReservaConServicios(?, ?, ?)',
            [id_usuario, id_paquete, serviciosStr]
        );

        // El procedimiento `CrearReservaConServicios` realiza un INSERT y no devuelve directamente el `Total`.
        // Para obtener el total de la reserva recién creada, podrías:
        // 1. Modificar el SP para que devuelva el Total como parámetro OUT.
        // 2. Después de llamar al SP, hacer un SELECT a la tabla `reserva` usando `LAST_INSERT_ID()`
        //    para obtener el ID de la reserva creada y luego su `Total`.
        // Por simplicidad, por ahora simplemente confirmamos que la reserva se intentó crear.
        // El frontend ya calcula un total estimado antes de enviar.

        res.status(201).json({ success: true, message: 'Reserva creada con éxito.', id_reserva_creada: result.insertId });

    } catch (error) {
        console.error('Error al crear la reserva:', error);
        // Manejo de errores de la base de datos (ej. FK constraint, datos inválidos)
        res.status(500).json({ success: false, message: 'Error interno del servidor al crear la reserva', details: error.message });
    }
});

// Iniciar la conexión a la DB y luego el servidor
conectarDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor Node.js escuchando en http://localhost:${PORT}`);
    });
});


