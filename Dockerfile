# ================================
# Build Stage
# ================================
FROM node:20-alpine AS build

# Install native dependencies required for better-sqlite3 and vips
RUN apk update && apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    vips-dev \
    git \
    python3 \
    make \
    g++

WORKDIR /opt/

# Copy package configuration
COPY package.json package-lock.json ./

# Install dependencies (including devDependencies for TypeScript & Admin build)
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm ci

ENV PATH=/opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY . .

# Build Strapi (TS + Admin panel)
ENV NODE_ENV=production
RUN npm run build

# ================================
# Production Runner Stage
# ================================
FROM node:20-alpine

# Install runtime library for vips
RUN apk add --no-cache vips-dev

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
COPY --from=build /opt/node_modules ./node_modules
ENV PATH=/opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY --from=build /opt/app ./

# Create SQLite database folder and ensure non-root permissions
RUN mkdir -p .tmp && chown -R node:node /opt/app /opt/node_modules

USER node

EXPOSE 1337

CMD ["npm", "run", "start"]
