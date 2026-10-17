export class ShopError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = new.target.name;
  }
}
