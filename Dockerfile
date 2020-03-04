FROM debian:latest

RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y nodejs \
    npm

RUN mkdir -p /usr/src/dpkg-render
WORKDIR /usr/src/dpkg-render

run npm i -g npm
RUN npm i express cors pug

COPY . /usr/src/dpkg-render
