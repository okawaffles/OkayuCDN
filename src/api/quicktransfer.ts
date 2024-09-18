import { Server as WSS } from 'ws';
import { ENABLE_DEBUG_LOGGING, SERVER } from '../main';
import { Logger } from 'okayulogger';
import { QuickTransferConnection, QuickTransferSessions, QuickTransferUsernameAssociations } from '../types';
import { CheckToken, GetUserFromToken } from '../util/secure';

const L = new Logger('QuickTransfer');

let wss;

const sessions: QuickTransferSessions = {};
const sender_usernames: QuickTransferUsernameAssociations = {};
const receiver_usernames: QuickTransferUsernameAssociations = {};

/*
DOCUMENTATION ON COMMUNICATION PROTOCOL:

handshake: 
- server: data = 'please identify' OR 'authentication pass' OR 'authentication fail'
- client: data = 'sender <token>' OR 'receiver <token>'

awaiting:
- server: data = 'pass' OR 'receiver ready' OR 'client ready'
- client: data = 'ready' | token = <token>

begin_transfer:
- server: total_chunks = <total chunks> | file_name = <file name>
- client (sender): total_chunks = <total chunks> | file_name = <file name> | token = <token>
- client (receiver): data = 'ready' | token = <token>

transfer:
- server (to sender): verify = 'pass' OR 'fail'
- server (to receiver): chunk = <current chunk> | data = <chunk data> | checksum = <chunk data checksum> (maybe?)
- client (sender): [same as server->receiver] | token = <token>
- client (receiver): [same as server->sender] | token = <token>

finish:
- server: (no response)
- client: data = 'destroying session, goodbye' | token = <token>
*/


/*

This implementation is pretty crude as it's just kind of a PoC right now.
I might refactor this code to be cleaner once I can get it working reliably.
I just think it's a really cool feature that would be pretty useful (to me at least).

*/
export function SetUpQuickTransfer() {
    L.debug('setting up quicktransfer websocket...');
    wss = new WSS({server:SERVER});

    wss.on('connection', (ws) => {
        if (ENABLE_DEBUG_LOGGING) L.debug('(websocket) new connection established, attempting handshake...');

        ws.send('{"message_type":"handshake","data":"please identify"}');

        ws.on('message', (message) => {
            if (ENABLE_DEBUG_LOGGING) L.debug(`(websocket) message received: ${message.toString()}`);

            try {
                const data = JSON.parse(message.toString());

                // HANDSHAKE
                if (data.message_type == 'handshake') {
                    const role = data.data.split(' ')[0];
                    const token = data.data.split(' ')[1];

                    if (!CheckToken(token)) { 
                        ws.send('{"message_type":"handshake","data":"authentication fail"}');
                        return L.error('Token is not valid, rejecting.');
                    }

                    const username = GetUserFromToken(token).username;
                        
                    sessions[token] = {ws, role};

                    if (role == 'sender') 
                        sender_usernames[username] = token;
                    else if (role == 'receiver') 
                        receiver_usernames[username] = token;

                    ws.send('{"message_type":"handshake","data":"authentication pass"}');
                }

                // AWAITING
                if (data.message_type == 'awaiting') {
                    const token = data.token;
                    const username = GetUserFromToken(token).username;
                    const session: QuickTransferConnection = sessions[token];

                    // the receiver will be the only one pinging, the sender will simply wait for the receiver to be online
                    if (session.role == 'receiver') {
                        if (!sender_usernames[username])
                            return ws.send('{"message_type":"awaiting","data":"pass"}'); 
                        else {
                            ws.send('{"message_type":"awaiting","data":"sender ready"}'); 
                            sessions[sender_usernames[username]].ws.send('{"message_type":"awaiting","data":"receiver ready"}');
                        }
                    }
                }

                // BEGIN TRANSFER
                if (data.message_type == 'begin_transfer') {
                    const token = data.token;
                    const username = GetUserFromToken(token).username;
                    const session: QuickTransferConnection = sessions[token];

                    if (session.role == 'sender') {
                        // simply forward the info to the receiver
                        sessions[receiver_usernames[username]].ws.send(`{"message_type":"begin_transfer","total_chunks":${data.total_chunks},"file_name":"${data.file_name}"}`);
                    }

                    if (session.role == 'receiver') {
                        // tell the sender we're ready for chunks
                        if (data.data == 'ready') sessions[sender_usernames[username]].ws.send('{"message_type":"begin_transfer","data":"ready"}');
                    }
                }

                // TRANSFER
                if (data.message_type == 'transfer') {
                    const token = data.token;
                    const username = GetUserFromToken(token).username;
                    const session: QuickTransferConnection = sessions[token];

                    if (session.role == 'sender') {
                        // simply forward the data to the receiver
                        sessions[receiver_usernames[username]].ws.send(`{"message_type":"transfer","chunk":${data.chunk},"data":"${data.data}"}`);
                    }

                    if (session.role == 'receiver') {
                        // simply forward the info to the sender
                        sessions[receiver_usernames[username]].ws.send(`{"message_type":"transfer","verify":"${data.verify}"}`);
                    }
                }
            } catch (err) {
                L.fatal('Unable to parse data from websocket client!');
                if (ENABLE_DEBUG_LOGGING) L.debug(`(FATAL) ${err}`);
                return;
            }
        });
    });
}