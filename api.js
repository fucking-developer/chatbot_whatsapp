const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http'); // Servidor HTTP
const { Server } = require('socket.io'); // Socket.io para tiempo real
const cwsp = require('./src/conex_swp'); // Archivo de conexión

cwsp.conex();

const app = express();
const port = process.env.PORT || 8484;

// Servidor HTTP y Socket.io
const server = http.createServer(app);
const io = new Server(server);

// Lista de palabras clave para identificar mensajes relacionados con ropa
const palabrasClave = [
    'ropa', 'precio', 'talla', 'venta', 'comprar', 'cuánto', 'costo', 'modelo', 'camiseta', 'playera',
    'blusa', 'pantalón', 'jeans', 'short', 'falda', 'vestido', 'abrigo', 'suéter', 'sudadera',
    'chamarra', 'chaqueta', 'ropa interior', 'calcetines', 'zapatos', 'tenis', 'sandalias', 
    'gorra', 'sombrero', 'bufanda', 'chaleco', 'uniforme', 'ropa deportiva', 'leggings', 'mayones',
    'pants', 'traje', 'traje de baño', 'bikini', 'bata', 'camisa', 'corbata', 'guantes', 'moño', 
    'tacones', 'botas', 'zapatos de vestir', 'ropa casual', 'ropa formal', 'ropa de dama', 'ropa de caballero', 
    'ropa de niño', 'ropa de bebé', 'ropa económica', 'oferta', 'rebaja', 'descuento', 'liquidación',
    'ropa nueva', 'ropa usada', 'ropa barata', 'ropa en tendencia', 'moda', 'estilo', 'conjunto',
    'set de ropa', 'outfit'
];

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Conexión de socket.io
io.on('connection', (socket) => {
    console.log('Cliente conectado');
});

// Escuchar nuevos mensajes desde el cliente de WhatsApp
cwsp.onNewMessage((mensaje) => {
    io.emit('nuevoMensaje', mensaje); // Emitir evento de nuevo mensaje a todos los clientes
});

// Ruta para mostrar mensajes iniciales
app.get('/mensajes', (req, res) => {
    const mensajes = cwsp.mensajes
        .filter(msg => msg.de !== 'tienda') // Excluir mensajes enviados por la tienda
        .map(msg => ({
            fecha: msg.fecha,
            de: msg.de,
            mensaje: msg.mensaje,
            relacionado: palabrasClave.some(palabra => msg.mensaje.toLowerCase().includes(palabra)),
            respuesta: palabrasClave.some(palabra => msg.mensaje.toLowerCase().includes(palabra))
                ? `😊 ¡Hola! Aquí tienes la información de nuestra tiendita:
                📍 Nuestra tienda está ubicada en el mercado principal, puesto #5.
                🛍️ Vendemos ropa casual, deportiva y formal para damas, caballeros y niños.
                💵 Algunos ejemplos de precios: Camisetas desde $150 MXN, vestidos desde $300 MXN, y pantalones desde $250 MXN.
                Si necesitas algo más, no dudes en escribirme. ¡Gracias por tu interés! 🙌`
                : 'No relacionado'
        }));

    res.render('mensajes', { mensajes });
});

server.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});
