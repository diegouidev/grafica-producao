# 1. A Imagem Base
# Vamos usar uma imagem oficial do Node.js (versão 18 "alpine" é leve)
FROM node:18-alpine

# 2. Define o Diretório de Trabalho
# Todos os comandos a partir daqui serão executados dentro de /app no contêiner
WORKDIR /app

# 3. Copia o 'package.json' primeiro
# Isso otimiza o cache do Docker. Se você não mudar as dependências,
# o Docker não vai rodar 'npm install' de novo.
# Copiamos ambos os arquivos de definição de pacote.
COPY package.json ./
COPY package-lock.json ./ 
# (Se você usa yarn, copie 'yarn.lock' em vez de package-lock.json)

# 4. Instala as Dependências
RUN npm install
# (Se você usa yarn, use 'RUN yarn install')

# 5. Copia o Resto do Projeto
# Copia todo o código-fonte (src, public, etc.) para o /app
COPY . .

# 6. Expõe a Porta
# O servidor de desenvolvimento do React/Next.js geralmente roda na porta 3000
EXPOSE 3000

# 7. O Comando para Rodar
# Verifica no seu 'package.json' qual é o script de 'start' ou 'dev'
# Para Create-React-App, geralmente é 'start'
# Para Next.js, geralmente é 'dev'
CMD ["npm", "run", "dev"] 
# (Se for Next.js, mude para: CMD ["npm", "run", "dev"])