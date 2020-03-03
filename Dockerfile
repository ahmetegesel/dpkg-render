FROM debian:latest

RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y nodejs \
    npm

RUN mkdir -p /usr/src/dpkg-render
WORKDIR /usr/src/dpkg-render

RUN npm install express cors

COPY . /usr/src/dpkg-render

EXPOSE 8080

CMD ["node", "index.js"]
