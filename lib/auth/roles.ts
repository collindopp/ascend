import type { Role } from "@/lib/generated/prisma/enums";

export function roleHomePath(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/manager/overview";
    case "MANAGER":
      return "/manager/overview";
    case "SETTER":
      return "/home";
  }
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "MANAGER":
      return "Manager";
    case "SETTER":
      return "Setter";
  }
}
