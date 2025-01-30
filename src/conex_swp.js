const fs = require('fs');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const EventEmitter = require('events');

// Extender EventEmitter para emitir eventos personalizados
class MessageEmitter extends EventEmitter {}
const messageEmitter = new MessageEmitter();

// Configuración del cliente con persistencia de sesión
const client = new Client({
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    },
    authStrategy: new LocalAuth() // Persistencia automática de la sesión
});

// Lista de mensajes
let mensajes = [];

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

// Respuestas personalizadas
const ubicacion = "Nuestra tienda está ubicada en el mercado principal, puesto #5.";
const tiposRopa = "Vendemos ropa casual, deportiva y formal para damas, caballeros y niños.";
const ejemplosPrecios = "Camisetas desde $150 MXN, vestidos desde $300 MXN, y pantalones desde $250 MXN.";

// Inicialización del cliente y manejo de eventos
const conex = async () => {
    client.on('qr', qr => {
        qrcode.generate(qr, { small: true }); // Mostrar el QR en la terminal
        console.log("Escanea el código QR para iniciar sesión.");
    });

    client.on('ready', () => {
        console.log("El cliente está listo para recibir mensajes.");
    });

    client.on('message', async (msg) => {
        const mensajeRecibido = { 
            de: msg.from, 
            mensaje: msg.body, 
            fecha: new Date().toLocaleString(), 
            tipo: 'recibido' 
        };

        // Agregar mensaje recibido a la lista
        mensajes.push(mensajeRecibido);
        messageEmitter.emit('newMessage', mensajeRecibido); // Emitir el evento de nuevo mensaje

        await procesarMensaje(msg.from, msg.body);
    });

    client.on('disconnected', (reason) => {
        console.log("El cliente se ha desconectado:", reason);
    });

    await client.initialize();
};

// Procesar los mensajes recibidos
const procesarMensaje = async (cel, mensaje) => {
    console.log('De:', cel);
    console.log('Mensaje:', mensaje);

    try {
        const mensajeLower = mensaje.toLowerCase();

        // Verificar si el mensaje contiene palabras clave relacionadas con ropa
        if (palabrasClave.some(palabra => mensajeLower.includes(palabra))) {
            console.log("Mensaje relacionado con ropa detectado.");

            const respuesta = `😊 ¡Hola! Aquí tienes la información de nuestra tiendita:
            📍 ${ubicacion}
            🛍️ ${tiposRopa}
            💵 Algunos ejemplos de precios: ${ejemplosPrecios}
            
            Si necesitas algo más, no dudes en escribirme. ¡Gracias por tu interés! 🙌`;

            const mensajeEnviado = { 
                de: 'tienda', 
                mensaje: respuesta, 
                fecha: new Date().toLocaleString(), 
                tipo: 'enviado' 
            };

            mensajes.push(mensajeEnviado); // Registrar mensaje enviado
            messageEmitter.emit('newMessage', mensajeEnviado); // Emitir evento de nuevo mensaje enviado

            await client.sendMessage(cel, respuesta); // Enviar el mensaje al usuario
        } else {
            console.log("Mensaje no relacionado con ropa. No se enviará respuesta.");
        }
    } catch (error) {
        console.error("Error al procesar el mensaje:", error);
    }
};

// Exportar la funcionalidad
module.exports = {
    conex, // Inicializar la conexión del cliente
    mensajes, // Lista de mensajes registrados
    onNewMessage: (callback) => messageEmitter.on('newMessage', callback) // Escuchar nuevos mensajes
};
