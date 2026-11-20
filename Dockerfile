# Multi-stage production container with Node.js, FFmpeg, and yt-dlp
FROM node:20-bullseye-slim

# Install FFmpeg and yt-dlp dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# Copy application files
COPY package.json ./
RUN npm install --production --silent || true

COPY . .

# Create clips directory and set permissions
RUN mkdir -p clips && chmod 777 clips

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "server/server.js"]
