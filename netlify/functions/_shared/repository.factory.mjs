import { ProductsRepository } from "./products.repository.mjs";
import { OrdersRepository, ReservationsRepository, CustomersRepository } from "./orders.repository.mjs";

const constructors = {
  products: ProductsRepository,
  orders: OrdersRepository,
  customers: CustomersRepository,
  reservations: ReservationsRepository,
};

export function createRepository(name) {
  const Repository = constructors[name];
  if (!Repository) throw new Error(`Repositorio desconocido: ${name}`);
  return new Repository();
}
