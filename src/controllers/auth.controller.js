// CONTROLADOR de autenticación: traduce req/res al servicio de auth.
import { authService } from "../services/index.js";

export async function login(req, res) {
  return res.json(await authService.login(req.valid.body));
}

export async function register(req, res) {
  return res.status(201).json(await authService.register(req.valid.body));
}

export async function me(req, res) {
  return res.json(await authService.me(req.auth.id));
}
