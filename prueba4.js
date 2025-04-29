const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-writer').createObjectCsvWriter;

const client = new Client();

// Definir la ruta del archivo CSV
const csvFilePath = path.join(__dirname, 'messages.csv');

// Crear un escritor de CSV con encabezados
const writer = csvWriter({
    path: csvFilePath,
    header: [
        { id: 'from', title: 'Remitente' },
        { id: 'body', title: 'Mensaje' },
        { id: 'date', title: 'Fecha' },
        { id: 'type', title: 'Tipo' }
    ],
    append: true 
});

// Función para guardar mensajes en el CSV
const saveMessageToCSV = (message) => {
    const date = new Date(message.timestamp * 1000);  
    const formattedDate = date.toLocaleString();  

    writer.writeRecords([{
        from: message.fromMe ? 'Yo' : message.from,
        body: message.body,
        date: formattedDate,
        type: message.fromMe ? 'Enviado' : 'Recibido'
    }])
    .then(() => {
        console.log(` Mensaje guardado en CSV: ${message.body}`);
    })
    .catch(err => {
        console.error('Error al guardar el mensaje en CSV:', err);
    });
};

// Escanear el código QR cuando se genera
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// Cuando el cliente esté listo
client.on('ready', async () => {
    console.log('✅ Cliente listo!');

    try {
        const chats = await client.getChats();
        console.log(`\n📥 Tienes ${chats.length} chats abiertos:`);

        chats.forEach((chat, index) => {
            console.log(`${index + 1}. ${chat.name || chat.id.user}`);
        });

        const targetChatName = 'Tatiana';  // Ajusta aquí tu chat

        const chat = chats.find(c => (c.name && c.name.includes(targetChatName)) || (c.id.user && c.id.user.includes(targetChatName)));

        if (!chat) {
            console.log('❌ Chat no encontrado.');
            return;
        }

        const messages = await chat.fetchMessages({ limit: 100 });

        console.log(`\n Últimos mensajes de "${chat.name || chat.id.user}":`);

        messages.forEach(message => {
            saveMessageToCSV(message);
            const date = new Date(message.timestamp * 1000);
            const formattedDate = date.toLocaleString();

            console.log(message.fromMe ? ` Mensaje ENVIADO:` : ` Mensaje RECIBIDO:`);
            console.log(`Remitente: ${message.fromMe ? 'Yo' : message.from}`);
            console.log(`Mensaje: ${message.body}`);
            console.log(`Fecha: ${formattedDate}`);
        });

    } catch (error) {
        console.error('Error al obtener los mensajes:', error);
    }
});

// Escuchar nuevos mensajes recibidos
client.on('message', async (message) => {
    try {
        if (!message.fromMe) {  // Solo si no soy yo quien lo envió
            saveMessageToCSV(message);

            const date = new Date(message.timestamp * 1000);
            const formattedDate = date.toLocaleString();

            console.log(`\n Nuevo mensaje RECIBIDO:`);
            console.log(` Remitente: ${message.from}`);
            console.log(` Mensaje: ${message.body}`);
            console.log(` Fecha: ${formattedDate}`);
        }
    } catch (error) {
        console.error('Error al manejar el mensaje nuevo recibido:', error);
    }
});

// Escuchar mensajes creados (es decir, enviados por mí)
client.on('message_create', async (message) => {
    try {
        if (message.fromMe) {  // Solo los mensajes que yo envié
            saveMessageToCSV(message);

            const date = new Date(message.timestamp * 1000);
            const formattedDate = date.toLocaleString();

            console.log(`\n Nuevo mensaje ENVIADO:`);
            console.log(` Remitente: Yo`);
            console.log(` Mensaje: ${message.body}`);
            console.log(` Fecha: ${formattedDate}`);
        }
    } catch (error) {
        console.error('Error al manejar el mensaje enviado:', error);
    }
});

// Manejo de desconexión
client.on('disconnected', (reason) => {
    console.log('❌ Cliente desconectado:', reason);
});

// Inicializar el cliente
client.initialize();
