class Message extends Error {
    /**
     * @param {string} message Mensagem de erro
     */
    constructor(message: string) {
        super(message);

        return this;
    }
}

export default Message;
