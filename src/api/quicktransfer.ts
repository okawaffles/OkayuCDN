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
- server: data = 'please identify' OR 'authentication pass' OR 'authentication fail' OR 'authentication duplicate'
- client: data = 'sender <token>' OR 'receiver <token>'

e2ee:
- server: (forwards any data)
- client: key? = '<public key>' | status? = 'e2ee accepted' OR 'public key requested'

awaiting:
- server: data = 'pass' OR 'receiver ready' OR 'client ready'
- client: data = 'ready' | token = <token>

begin_transfer:
- server: total_chunks = <total chunks> | file_name = <file name>
- client (sender): total_chunks = <total chunks> | file_name = <file name> | token = <token>
- client (receiver): data = 'ready' | token = <token>

transfer:
- server (to sender): verify = 'pass' OR 'fail' | status = 'awaiting metadata' OR 'awaiting data'
- server (to receiver): chunk = <current chunk> | data = <chunk data> | checksum = <chunk data checksum> (maybe?)
- client (sender): [same as server->receiver] | token = <token>
- client (receiver): [same as server->sender] | token = <token>

finish:
- server: (no response)
- client: data = 'destroying session, goodbye' | token = <token>

error:
- server: 'authentication expired' OR 'internal server error'
- client: (none)
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
            // if (ENABLE_DEBUG_LOGGING) L.debug(`(websocket) message received: ${message.toString()}`);

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

                    if (role == 'sender') {
                        // if (receiver_usernames[username]) {
                        //     L.error('SENDER tried to authenticate, but token already exists for RECEIVER. Terminating RECEIVER session.');

                        //     sessions[receiver_usernames[username]].ws.send('{"message_type":"finish","data":"destroying session, goodbye"}');
                        //     sessions[receiver_usernames[username]].ws.close();

                        //     delete receiver_usernames[username];
                        //     return ws.send('{"message_type":"handshake","data":"authentication duplicate"}');
                        // }
                        sender_usernames[username] = token;
                    } else if (role == 'receiver') { 
                        // if (sender_usernames[username]) {
                        //     L.error('RECEIVER tried to authenticate, but token already exists for SENDER. Terminating SENDER session.');

                        //     sessions[sender_usernames[username]].ws.send('{"message_type":"finish","data":"destroying session, goodbye"}');
                        //     sessions[sender_usernames[username]].ws.close();

                        //     delete sender_usernames[username];
                        //     return ws.send('{"message_type":"handshake","data":"authentication duplicate"}');
                        // }
                        receiver_usernames[username] = token;
                    }

                    sessions[token] = {ws, role};

                    if (ENABLE_DEBUG_LOGGING) L.debug(`websocket for ${username} as role ${(<string>role).toUpperCase()} has been authenticated`);

                    ws.send('{"message_type":"handshake","data":"authentication pass"}');

                    return;
                }

                if (!CheckToken(data.token)) return ws.send('{"message_type":"error","data":"authentication expired"}');

                // E2EE
                if (data.message_type == 'e2ee') {
                    const token = data.token;
                    const username = GetUserFromToken(token).username;
                    const session: QuickTransferConnection = sessions[token];

                    if (session.role == 'sender') {
                        // simply forward the data to the receiver
                        sessions[receiver_usernames[username]].ws.send(`{"message_type":"e2ee","status":"${data.status}","aes":"${data.aes||''}"}`);
                    }

                    if (session.role == 'receiver') {
                        // simply forward the info to the sender
                        sessions[sender_usernames[username]].ws.send(`{"message_type":"e2ee","key":"${data.key}"}`);
                    }
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
                        sessions[receiver_usernames[username]].ws.send(`{"message_type":"transfer","chunk":${data.chunk},"data":"${data.data}","iv":"${data.iv}","md5":"${data.md5}"}`);
                    }

                    if (session.role == 'receiver') {
                        // simply forward the info to the sender
                        sessions[sender_usernames[username]].ws.send(`{"message_type":"transfer","verify":"${data.verify}"}`);
                    }
                }

                // FINAL
                if (data.message_type == 'final' && data.data == 'destroying session, goodbye') {
                    
                    const token = data.token;
                    const username = GetUserFromToken(token).username;
                    const session: QuickTransferConnection = sessions[token];
                    delete sessions[token];

                    if (ENABLE_DEBUG_LOGGING) L.debug(`websocket for ${username} (${session.role}) has been closed`);

                    if (session.role == 'sender')
                        delete sender_usernames[username];
                    else if (session.role == 'receiver')
                        delete receiver_usernames[username];

                    ws.close();                    
                }
            } catch (err) {
                L.fatal('Unable to handle websocket request; dropping it to prevent issues!!');
                if (ENABLE_DEBUG_LOGGING) L.debug(`(FATAL) ${err}`);
                return;
            }
        });
    });
}