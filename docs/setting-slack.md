# Configurando o Slack

Passo a passo com as configurações necessárias para configurar o bot no slack

## Criando um novo Bot em uma Worskpace do Slack

### 1. Vá em https://api.slack.com/apps e clique em **Create New App**

![Create App](images/create-new-app.png)

### 2. Configurar o **Slash Command**, clicando em um dos links assinalados abaixo:

![Slash Command](images/slash-command.png)

### 3. Adicionar o Slash Command ```/code-review``` conforme exemplo abaixo:

![New Command](images/new-command.png)

### 4. Instalar o Bot no Worspace

![Install App](images/install-app.png)

### 5. Configurar as permissões ```commands```, ```chat:write:bot```, ```emoji:read```, ```incoming-webhook```, ```reactions:read```, ```chat:write:user```, ```users:read```, ```channels:read```, ```groups:read```, ```mpim:read```, ```im:read``` e reinstalá-lo no Workspace

![Permissions](images/permissions.png)

### 6. Adicionar o Bot aos canais de code review do Slack para que ele possa contabilizar as reações

![Add Bot Channel](images/add-bot-channel.png)

### 7. Copiar os Tokens e Keys necessárias para configuração do Bot no Mongo

![OAuth Token](images/oauth-token.png)

![Secret and Token](images/secret-signing-secret.png)
