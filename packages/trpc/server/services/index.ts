import UserService from "@repo/services/user";
export { authService, isSuperAdminEmail } from "@repo/services/auth";
export { tokenService } from "@repo/services/token";

export const userService = new UserService();
