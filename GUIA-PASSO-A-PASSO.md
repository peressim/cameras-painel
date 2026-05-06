# Guia Passo a Passo — Publicar o Painel na Web

> **Para quem:** Gerente de operações sem experiência em desenvolvimento.  
> **Tempo estimado:** 30 a 45 minutos para o primeiro deploy.

---

## O que você vai ter no final

Um endereço na internet (ex: `https://minha-frota.netlify.app`) onde você e sua equipe podem:
- Ver o vídeo ao vivo das câmeras JC400
- Receber alertas de colisão, SOS, fadiga, ADAS/DMS em tempo real
- Solicitar o download de vídeos e fotos de eventos
- Consultar o histórico de gravações

---

## Pré-requisitos

Antes de começar, certifique-se de ter:
1. O servidor IoT Hub rodando e acessível pela internet
2. As portas **10088**, **8881** (ou **8890**) e **23010** abertas no firewall do servidor
3. Uma conta de e-mail para criar as contas gratuitas

---

## PARTE 1 — Criar conta no GitHub (guarda os arquivos)

O GitHub guarda os arquivos do painel. O Netlify vai buscar deles de lá para publicar.

**Passo 1.1** — Acesse [github.com](https://github.com) e clique em **"Sign up"** (Criar conta).

**Passo 1.2** — Preencha:
- Seu e-mail
- Uma senha
- Um nome de usuário (ex: `hugo-florestal`)

**Passo 1.3** — Confirme o e-mail que receberá no seu correio.

---

## PARTE 2 — Criar um repositório no GitHub

Um "repositório" é como uma pasta na nuvem que guarda os arquivos do seu painel.

**Passo 2.1** — Após entrar no GitHub, clique no botão verde **"New"** ou **"Create repository"**.

**Passo 2.2** — Preencha:
- **Repository name:** `cameras-painel`
- Marque a opção **"Public"**
- Clique em **"Create repository"**

**Passo 2.3** — Na página que abrir, clique em **"uploading an existing file"** (enviando um arquivo existente).

**Passo 2.4** — Abra a pasta `cameras-painel` no seu computador (que o Claude criou) e arraste **todos os arquivos e pastas** para a área de upload do GitHub.

> ⚠️ **Importante:** Você precisa manter a estrutura de pastas:
> ```
> cameras-painel/
> ├── index.html
> ├── package.json
> ├── netlify.toml
> └── netlify/
>     └── functions/
>         ├── pushalarm.mjs
>         ├── get-alerts.mjs
>         └── iot-proxy.mjs
> ```

**Passo 2.5** — No campo de mensagem embaixo, escreva: `Primeira versão do painel`

**Passo 2.6** — Clique em **"Commit changes"** (o botão verde).

---

## PARTE 3 — Criar conta no Netlify e conectar ao GitHub

O Netlify é o serviço gratuito que vai colocar seu painel na internet.

**Passo 3.1** — Acesse [netlify.com](https://netlify.com) e clique em **"Sign up"**.

**Passo 3.2** — Escolha **"Sign up with GitHub"** para entrar com a conta que você acabou de criar. Isso facilita a conexão.

**Passo 3.3** — Autorize o Netlify a acessar seu GitHub quando solicitado.

**Passo 3.4** — Na tela inicial do Netlify, clique em **"Add new site"** → **"Import an existing project"**.

**Passo 3.5** — Escolha **"Deploy with GitHub"**.

**Passo 3.6** — Autorize o acesso e selecione o repositório **`cameras-painel`** que você criou.

**Passo 3.7** — Na tela de configuração do deploy:
- **Branch to deploy:** `main`
- **Build command:** `npm install`
- **Publish directory:** `.` (ponto final, que significa "a pasta raiz")

**Passo 3.8** — Clique em **"Deploy site"**.

O Netlify vai processar por cerca de 1 a 2 minutos. Quando terminar, você vai ver uma URL do tipo `https://nome-aleatório.netlify.app`.

---

## PARTE 4 — Configurar o IoT Hub para enviar alertas para o seu painel

Agora você precisa dizer ao IoT Hub para onde ele deve enviar os alertas.

**Passo 4.1** — Anote a URL do seu site Netlify. Exemplo: `https://minha-frota.netlify.app`

**Passo 4.2** — Acesse o servidor onde o IoT Hub está instalado (via SSH ou painel de controle).

**Passo 4.3** — Abra o arquivo `docker-compose.yml` do IoT Hub e localize o serviço `msg-dispatch-iothub`.

**Passo 4.4** — Altere a linha `pushURL=http://xxxy` para:
```
pushURL=https://SEU-SITE.netlify.app/pushalarm
```

**Exemplo:**
```yaml
msg-dispatch-iothub:
  environment:
    - pushURL=https://minha-frota.netlify.app/pushalarm
    - pushToken=a12341234123
```

**Passo 4.5** — Reinicie o serviço para aplicar a mudança:
```bash
docker-compose restart msg-dispatch-iothub
```

> ✅ A partir deste momento, todos os alertas das câmeras serão enviados para o seu painel!

---

## PARTE 5 — Configurar o painel web

Agora abra o seu painel (`https://seu-site.netlify.app`) e configure os endereços do IoT Hub.

**Passo 5.1** — Clique no botão **"⚙ Configurações"** no canto superior direito.

**Passo 5.2** — Preencha os campos:

| Campo | O que colocar | Exemplo |
|-------|---------------|---------|
| **Endereço da API** | IP do servidor + porta 10088 | `http://120.78.224.93:10088` |
| **Endereço do Media Server** | IP do servidor + porta 8881 | `http://120.78.224.93:8881` |
| **Endereço de Arquivos** | IP do servidor + porta 23010 | `http://120.78.224.93:23010` |
| **serverFlagId** | Normalmente é `1` | `1` |
| **Channel ID** | Normalmente é `1` | `1` |

**Passo 5.3** — Clique em **"💾 Salvar"**.

---

## PARTE 6 — Adicionar seus veículos

**Passo 6.1** — Clique em **"+ Adicionar Veículo"** na barra lateral.

**Passo 6.2** — Preencha:
- **Nome:** Ex: "Caminhão Harvester 01"
- **IMEI:** O número de 15 dígitos do dispositivo JC400 (você pode encontrar na etiqueta do equipamento ou no painel do IoT Hub)
- **Ícone:** Escolha o ícone que preferir

**Passo 6.3** — Clique em **"✅ Adicionar"**.

Repita para cada veículo da sua frota.

---

## PARTE 7 — Testar o vídeo ao vivo

**Passo 7.1** — Clique em um veículo na lista lateral.

**Passo 7.2** — Clique em **"▶ Iniciar Câmera Frontal"**.

**Passo 7.3** — Aguarde 3 a 5 segundos. O vídeo deve aparecer.

> ⚠️ **Se o vídeo não aparecer:**
> - Verifique se o veículo está em área com sinal de celular
> - Confirme que a porta **8881** está aberta no firewall do servidor
> - Se o site usa `https://`, a câmera precisa suportar `https://` na porta **8890**
> - Use o Chrome para melhores resultados com streaming FLV

---

## PARTE 8 — Receber e visualizar alertas

Os alertas chegam automaticamente a cada 30 segundos. Você também pode clicar em **"🔄 Atualizar"** para verificar imediatamente.

Quando um alerta com vídeo chegar, aparecerá o botão **"📥 Mídia"** — clique para solicitar o download do vídeo ou foto do evento.

---

## Solução de Problemas Comuns

| Problema | Causa mais comum | Solução |
|----------|-----------------|---------|
| Vídeo não carrega | Porta 8881 fechada | Abra a porta no firewall do servidor |
| Alertas não chegam | pushURL incorreto | Verifique o docker-compose do msg-dispatch-iothub |
| "Erro ao enviar comando" | Porta 10088 fechada | Abra a porta no firewall |
| Site mostra "⚠ Sem configuração" | Configurações não salvas | Clique em ⚙ e salve os endereços |
| Vídeo trava/falha no Chrome | Mixed content (HTTP/HTTPS) | Configure HTTPS no servidor (porta 8890) |

---

## Dicas de Segurança

- Evite deixar as portas do IoT Hub abertas para todo mundo — se possível, restrinja ao IP do seu escritório
- Troque as senhas padrão do docker-compose (`jimi@123`) por senhas fortes
- O painel salva as configurações só no seu navegador — não compartilhe prints com endereços de servidor

---

## Precisa de Ajuda?

Se algo não funcionar, reabra o Claude e descreva exatamente o que você viu ou a mensagem de erro. Com os arquivos já criados, qualquer ajuste é simples.
