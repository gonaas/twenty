# The tag must match the pinned playwright version in package.json so the
# bundled Chromium is the one the library expects.
FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

COPY tsconfig.json tsup.config.ts ./
COPY src ./src
RUN yarn build

ENV NODE_ENV=production
ENV PORT=8080
ENV DATA_DIR=/data

EXPOSE 8080

CMD ["node", "dist/main.js"]
