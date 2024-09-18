const net = require('net');
const http = require('http');
const { Server } = require('socket.io');

// Store clients and their usernames (TCP)
let clients = {};
let socketIO;
let socks = null;
let sockets = {};

const tcpServer = net.createServer((socket) => {
    let username;

    socket.write('Welcome! Please enter your username: ');

    // Listen for data from the user
    socket.on('data', (data) => {
        const message = data.toString().trim();

        if (!username) {
            if (clients[message]) {
                socket.write('Username is already taken. Choose another: ');
            } else {
                username = message;
                clients[username] = socket;
                sockets[username] = socket; 
                socket.write(`Username set! You are now connected as ${username}\n`);
                console.log(`${username} has connected.`);
            }
        } else {
            // Check if the message is in the format "@username message"
            const privateMessage = message.match(/^@(\w+)\s+(.+)$/);
            if (privateMessage) {
                const recipient = privateMessage[1];
                const msg = privateMessage[2];

                if (clients[recipient]) {
                    clients[recipient].write(`[Private from ${username}]: ${msg}\n`);
                    socket.write(`[Private to ${recipient}]: ${msg}\n`);
                } else {
                    socket.write(`User ${recipient} not found.\n`);
                }
            } else {
                socket.write('To send a private message, use the format: @username message\n');
            }
        }
    });

    socket.on('end', () => {
        if (username) {
            delete clients[username];
            delete sockets[username];  
            console.log(`${username} has disconnected.`);
        }
    });

    // Handle errors
    socket.on('error', (err) => {
        console.error(`Error with user ${username}:`, err.message);
    });
});

// HTTP server for handling WebSocket connections (via socket.io)
const httpServer = http.createServer();

socketIO = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

// Handle WebSocket connections
socketIO.on('connection', (socket) => {
    socks = socket;
    console.log('Client connected via WebSocket');

    // Handle the 'log' event and push the data to TCP sockets
    socket.on('log', (data) => {
        console.log('log event received:', data);

        // For example, broadcasting to all connected TCP clients:
        // for (const clientUsername in sockets) {
        //     sockets[clientUsername].write(`[WebSocket log]: ${data}\n`);
        // }

        //  send it to a specific user (for example, 'user1'):
        if (sockets['hell']) {
            sockets['hell'].write(`[WebSocket log]: ${data}\n`);
        }

        // Broadcast the data back to other WebSocket clients if needed
        socket.broadcast.emit('login', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected from WebSocket');
    });
});

// Start the TCP server
const TCP_PORT = 8000;
tcpServer.listen(TCP_PORT, () => {
    console.log(`TCP Server listening on port ${TCP_PORT}`);
});

// Start the WebSocket server
const HTTP_PORT = 3009;
httpServer.listen(HTTP_PORT, () => {
    console.log(`HTTP Server (WebSocket) listening on port ${HTTP_PORT}`);
});
