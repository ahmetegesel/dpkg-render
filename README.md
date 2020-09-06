# dpkg-render

## Purpose

In a Debian or an Ubuntu system there is a file called `/var/lib/dpkg/status` 
that holds information about software packages installed on the OS. 
This is a simple NodeJS application to render all installed packages and give users 
some information about them such as Name, Description and Dependent Packages.

## Install
First install npm packages:
```shell script
npm install
```

You also need to set up the environment variable for the path to the DPKG Status file

Create an `.env` file fill it as it is sampled in `.env.sample` fileç

## Run

### On a Linux OS

```shell script
npm start
```

### On Docker

For those who do not have Linux OS installed on their computer:

```
docker-compose up
```

## Tests

To run the tests:
```shell script
npm run test
```

# TODO
- Tests
