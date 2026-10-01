# PELADEIROS - ITAPOÃ PARQUE

App web para organizar a pelada semanal.

**Próxima partida:** Sábado, 03 de outubro · 08:00 · Itapoã Parque

---

## Funcionalidades

- Lista de **participação** (confirmar presença dias antes)
- Lista de **sorteio** (ordem de chegada no campo)
- Progresso até 16 jogadores
- Sorteio manual de 2 times de 8 (feito pelo admin)
- Área administrativa protegida por login
- Interface dark, mobile-first

---

## Como publicar no GitHub + GitHub Pages (grátis)

### 1. Criar o repositório no GitHub
1. Acesse https://github.com/new
2. Nome sugerido: `peladeiros-itapoa`
3. Deixe **público**
4. **Não** marque "Add a README" (já temos um)
5. Clique em **Create repository**

### 2. Subir os arquivos
No seu computador, na pasta do projeto:

```bash
git init
git add .
git commit -m "Primeira versão - Peladeiros Itapoã Parque"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/peladeiros-itapoa.git
git push -u origin main
```

(Substitua `SEU-USUARIO` pelo seu usuário do GitHub)

### 3. Ativar o GitHub Pages
1. No repositório → **Settings** → **Pages**
2. Em **Source**, escolha **Deploy from a branch**
3. Branch: `main` · pasta: `/ (root)`
4. Salve
5. Em 1–2 minutos o site estará em:

```
https://SEU-USUARIO.github.io/peladeiros-itapoa/
```

Compartilhe esse link com a galera.

---

## Como usar no dia a dia

| Momento | O que fazer |
|---------|-------------|
| **Dias antes** | Toque no **+** → digite o nome → **Entrar na lista de participação** |
| **No campo (~15 min antes)** | Toque no seu nome → **Já estou no campo** |
| **Quando tiver 16 no campo** | Admin entra e clica em **Sortear times agora** |

### Login do Admin
- Usuário: `darlyson.santos`
- Senha: `40028922`

---

## Arquivos do projeto

```
peladeiros-itapoa/
├── index.html    ← página principal
├── styles.css    ← visual
├── app.js        ← lógica
└── README.md
```

Não precisa de servidor nem instalação. É só HTML + CSS + JavaScript.

---

## Observações importantes

- Os dados ficam salvos **no navegador** de cada pessoa (localStorage).
- Se quiser que **todos vejam a mesma lista em tempo real** (vários celulares), é necessário um backend (Firebase/Supabase). Posso implementar depois.
- A senha do admin está no código do frontend (visível). Para um grupo de amigos é aceitável; para uso mais sério, use autenticação real no backend.

---

Feito para a galera do **Itapoã Parque** ⚽
