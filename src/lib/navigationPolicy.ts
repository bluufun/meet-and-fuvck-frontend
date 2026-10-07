export type NavigationUser = {
  adminRole?: string | null;
  adminPermissions?: string[] | null;
  email?: string | null;
  emailisVerified?: boolean | null;
  role?: "seeker" | "funmate" | null;
  isProfileComplete?: boolean;
  galleryCompleted?: boolean;
  profileMedia?: string[] | null;
  verificationStatus?:
    | "not_started"
    | "pending"
    | "approved"
    | "rejected"
    | "manual_review_pending"
    | null;
  onboardingStage?: "path_selection" | "funmate_profile" | "complete" | null;
};

export function isAdminUser(user: NavigationUser | null | undefined) {
  return Boolean(user?.adminRole) || (user?.adminPermissions?.length ?? 0) > 0;
}

// A user is only considered verified once the backend has explicitly said
// so. Missing/undefined is treated as "not verified" so newly-registered
// users (who haven't gone through /verify-email yet) are never accidentally
// treated as verified.
export function isEmailVerified(user: Pick<NavigationUser, "emailisVerified">) {
  return user.emailisVerified === true;
}

function verifyEmailPath(user: Pick<NavigationUser, "email">) {
  return user.email
    ? `/verify-email?email=${encodeURIComponent(user.email)}`
    : "/verify-email";
}

export function hasCompletedGallery(
  user: Pick<NavigationUser, "galleryCompleted" | "profileMedia">,
) {
  return (
    Boolean(user.galleryCompleted) || (user.profileMedia?.length ?? 0) >= 2
  );
}

export function getPostAuthRedirect(user: NavigationUser) {
  if (isAdminUser(user)) return "/admin";

  // Email verification gates everything else — a user who hasn't verified
  // yet must never reach onboarding, dashboard, or any other page, no
  // matter what role (or lack of one) they have.
  if (!isEmailVerified(user)) {
    return verifyEmailPath(user);
  }

  if (!user.role) {
    return "/onboarding";
  }

  if (user.role === "seeker") {
    return "/dashboard";
  }

  if (user.role === "funmate") {
    if (!user.isProfileComplete) {
      return "/onboarding/funmate";
    }

    if (!hasCompletedGallery(user)) {
      return "/upload-gallery";
    }

    // A funmate who has already finished the live FaceVerify check and is
    // waiting on a human decision should land on the status page, not the
    // start-over page — logging out and back in shouldn't feel like being
    // sent back to square one.
    if (user.verificationStatus === "manual_review_pending") {
      return "/verification/review";
    }

    if (user.verificationStatus !== "approved") {
      return "/verification";
    }

    return "/dashboard";
  }

  return "/dashboard";
}

export function getLoginRedirect(user: NavigationUser) {
  if (isAdminUser(user)) return "/admin";
  if (!isEmailVerified(user)) return verifyEmailPath(user);
  if (!user.role) return "/onboarding";
  if (user.role === "seeker") return "/dashboard";
  return getPostAuthRedirect(user);
}

export function getProtectedRouteDecision(
  pathname: string,
  user: NavigationUser | null | undefined,
) {
  if (!user) return { allowed: false, redirectTo: "/login" };

  if (isAdminUser(user)) {
    if (pathname.startsWith("/admin")) return { allowed: true };
    return { allowed: false, redirectTo: "/admin" };
  }

  if (pathname.startsWith("/admin")) {
    return { allowed: false, redirectTo: "/dashboard" };
  }

  // Unverified users are blocked from every protected route — not just
  // funmate-specific ones — until they confirm their email.
  if (!isEmailVerified(user)) {
    return { allowed: false, redirectTo: verifyEmailPath(user) };
  }

  if (pathname === "/onboarding") {
    if (!user.role) return { allowed: true };
    if (user.role === "seeker")
      return { allowed: false, redirectTo: "/dashboard" };
    if (user.role === "funmate" && !user.isProfileComplete) {
      return { allowed: false, redirectTo: "/onboarding/funmate" };
    }
    if (user.role === "funmate") {
      return { allowed: false, redirectTo: "/dashboard" };
    }
    return { allowed: true };
  }

  if (pathname === "/upload-gallery") {
    if (user.role !== "funmate")
      return { allowed: false, redirectTo: "/dashboard" };
    if (!user.isProfileComplete)
      return { allowed: false, redirectTo: "/onboarding/funmate" };
    if (hasCompletedGallery(user) && user.verificationStatus === "approved") {
      return { allowed: false, redirectTo: "/dashboard" };
    }
    if (hasCompletedGallery(user)) {
      return { allowed: false, redirectTo: "/verification" };
    }
    return { allowed: true };
  }

  if (pathname.startsWith("/onboarding/funmate")) {
    if (user.role !== "funmate")
      return { allowed: false, redirectTo: "/onboarding" };
    if (user.isProfileComplete) {
      return hasCompletedGallery(user)
        ? { allowed: false, redirectTo: "/verification" }
        : { allowed: false, redirectTo: "/upload-gallery" };
    }
    return { allowed: true };
  }

  if (pathname === "/verification") {
    if (user.role !== "funmate")
      return { allowed: false, redirectTo: "/dashboard" };
    if (user.verificationStatus === "approved") {
      return { allowed: false, redirectTo: "/dashboard" };
    }
    if (user.verificationStatus === "manual_review_pending") {
      return { allowed: false, redirectTo: "/verification/review" };
    }
    if (!user.isProfileComplete) {
      return { allowed: false, redirectTo: "/onboarding/funmate" };
    }
    if (!hasCompletedGallery(user)) {
      return { allowed: false, redirectTo: "/upload-gallery" };
    }
    return { allowed: true };
  }

  if (pathname === "/verification/review") {
    if (user.role !== "funmate")
      return { allowed: false, redirectTo: "/dashboard" };
    if (user.verificationStatus === "approved") {
      return { allowed: false, redirectTo: "/dashboard" };
    }
    return { allowed: true };
  }

  if (pathname === "/dashboard" || pathname === "/activity") {
    if (user.role === "seeker") return { allowed: true };
    if (user.role === "funmate") {
      if (!user.isProfileComplete) {
        return { allowed: false, redirectTo: "/onboarding/funmate" };
      }
      if (!hasCompletedGallery(user)) {
        return { allowed: false, redirectTo: "/upload-gallery" };
      }
      if (
        user.verificationStatus === "not_started" ||
        user.verificationStatus === "rejected"
      ) {
        return { allowed: false, redirectTo: "/verification" };
      }
      if (
        user.verificationStatus === "manual_review_pending" ||
        user.verificationStatus === "pending"
      ) {
        return {
          allowed: false,
          redirectTo:
            user.verificationStatus === "manual_review_pending"
              ? "/verification/review"
              : "/verification",
        };
      }
      return { allowed: true };
    }
    return { allowed: false, redirectTo: "/login" };
  }

  return { allowed: true };
}
