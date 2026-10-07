export type OnboardingStage = "path_selection" | "funmate_profile" | "complete";
export type { NavigationUser as RouteUser } from "./navigationPolicy";
export {
  isAdminUser as isAdminRouteUser,
  hasCompletedGallery,
  getPostAuthRedirect,
  getLoginRedirect,
} from "./navigationPolicy";
