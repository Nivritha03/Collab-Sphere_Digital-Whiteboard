const { Client } = require('@stomp/stompjs');
// Need websocket for node
Object.assign(global, { WebSocket: require('ws') });

const client = new Client({
    brokerURL: 'ws://localhost:8080/ws-native',
    onConnect: () => {
        console.log('CONNECTED TO /ws-native');
        client.deactivate();
    },
    onStompError: (e) => {
        console.log('STOMP ERROR', e.message);
    },
    onWebSocketClose: () => {
        console.log('WS CLOSED');
    }
});
client.activate();

setTimeout(() => {
    console.log('TRYING /ws');
    const client2 = new Client({
        brokerURL: 'ws://localhost:8080/ws',
        onConnect: () => {
            console.log('CONNECTED TO /ws');
            client2.deactivate();
            process.exit(0);
        },
        onWebSocketClose: () => {
            console.log('WS2 CLOSED');
            process.exit(1);
        }
    });
    client2.activate();
}, 2000);
