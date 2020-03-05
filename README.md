# dpkg-render

## Purpose

In a Debian or an Ubuntu system there is a file called /var/lib/dpkg/status that holds information about software packages that the system knows about. This is a simple NodeJS application to render all installed packages and give users some information about them such as Name, Description and Dependent Packages.

Since I didn't have a Linux system installed, I had to builda Docker image to test it.

To start test the app, after cloning the repository

If you are working in a Debian or Ubuntu OS

Install all packages:

```
npm i
```

```
npm start
```

If you have Docker installed on your computer

```
docker-compose up --build
```
