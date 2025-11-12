# 1. A Imagem Base
FROM python:3.10-slim

# 2. Variáveis de Ambiente
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 3. Instala as dependências de sistema (para o WeasyPrint)
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libgobject-2.0-0 \
    libgdk-pixbuf-xlib-2.0-0 \
    libcairo2 \
    fonts-liberation \
    libpangoft2-1.0-0 \
    --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*

# 4. Define o Diretório de Trabalho
WORKDIR /app

# 5. Instala as Dependências do Python
COPY requirements.txt .
RUN pip install -r requirements.txt

# 6. Copia o Resto do Projeto
COPY . .