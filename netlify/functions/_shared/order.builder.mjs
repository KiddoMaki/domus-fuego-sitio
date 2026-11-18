export class OrderBuilder {
  constructor(customerId) {
    this.order = { customerId, items: [] };
  }

  addItem(productId, quantity, unitPrice) {
    this.order.items.push({ productId, quantity, unitPrice });
    return this;
  }

  calculateTotal() {
    this.order.total = this.order.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    return this;
  }

  build() {
    if (!this.order.items.length) throw new Error("El pedido no tiene artículos");
    if (this.order.total == null) throw new Error("Falta calcular el total");
    return Object.freeze({ ...this.order, items: [...this.order.items] });
  }
}
