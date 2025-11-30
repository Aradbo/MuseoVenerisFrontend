// utils/logout.ts
export function logout() {
  // Eliminar LocalStorage
  localStorage.removeItem("token");
  localStorage.removeItem("tipoUsuario");
  localStorage.removeItem("idEmpleado");
  localStorage.removeItem("idVisitante");

  // Eliminar cookie
  document.cookie = "tipoUsuario=; path=/; max-age=0";

  // Recargar para validar middleware
  window.location.href = "/inicio";
}
