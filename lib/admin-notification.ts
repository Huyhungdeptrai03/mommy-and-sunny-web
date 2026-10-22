export const ADMIN_SUCCESS_EVENT = "admin:operation-success";

const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);

export function notifyAdminMutationSuccess(url?: string, method?: string): void {
  if (
    typeof window === "undefined" ||
    !url?.startsWith("/admin/") ||
    !method ||
    !MUTATION_METHODS.has(method.toLowerCase())
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<string>(ADMIN_SUCCESS_EVENT, {
      detail: "Thao tác đã hoàn thành thành công",
    })
  );
}
