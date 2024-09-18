const net = require('net');
const http = require('http');
const { Server } = require('socket.io');

// Store clients and their usernames
let clients = {};
let socketIO;
var sockets = {};
var socks = null;
// TCP server for handling raw TCP connections
const tcpServer = net.createServer((socket) => {
    let username;

    socket.write('Welcome! Please enter your username: ');

    // Listen for data from the user
    socket.on('data', (data) => {
        const message = data.toString().trim();

        // If the user hasn't set a username, set it first
        if (!username) {
            if (clients[message]) {
                socket.write('Username is already taken. Choose another: ');
            } else {
                username = message;
                clients[username] = socket;
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
                // If it's not a private message, inform the user of how to send private messages
                socket.write('To send a private message, use the format: @username message\n');
            }
        }
    });

    // Remove user from clients on disconnect
    socket.on('end', () => {
        if (username) {
            delete clients[username];
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

    socket.on('log', (data) => {
        console.log('log event received',data);
        // Handle terminal creation here
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
