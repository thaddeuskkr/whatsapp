export enum Op {
    Heartbeat, // to be sent / received every 30 seconds, or the connection will be closed
    Error, // to be sent when an error occurs, with an error message
    Open, // to be sent when the connection is opened and the client is ready to receive messages
    Close, // to close the connection, with an optional reason
    MessageCreate, // to let the client know that a message has been created
    MessageEdit, // to let the client know that a message has been edited
    MessageRevoke, // to let the client know that a message has been revoked
}
