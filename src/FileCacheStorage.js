import fs from 'fs';

export default class FileCacheStorage {
  #lastModified;

  #cache;

  #path;

  #getter;

  constructor({ path, getter }) {
    this.#path = path;
    this.#getter = getter;
  }

  get() {
    const { mtimeMs: lastModified } = fs.statSync(this.#path);

    if (this.#lastModified !== lastModified) {
      this.#cache = this.#getter();
      this.#lastModified = lastModified;
    }

    return this.#cache;
  }
}
