const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

function fromStatusHint(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid email or password")) {
    return "Incorrect email or password.";
  }
  if (lower.includes("not found")) {
    return "We couldn't find what you're looking for.";
  }
  if (lower.includes("expired")) {
    return "That code or link has expired. Please request a new one.";
  }
  if (lower.includes("phone should be 11 digit long")) {
    return "Please use an 11-digit WhatsApp number and try again.";
  }
  if (lower.includes("billstack request failed")) {
    return "We couldn't generate your dedicated account right now. Please check your details and try again.";
  }
  if (lower.includes("faceverify_no_face") || lower.includes("no_face_detected")) {
    return "We couldn't detect a clear face in this photo. Please upload a different selfie where your face is fully visible.";
  }
  if (lower.includes("faceverify_blurry_image") || lower.includes("blurry_image")) {
    return "This photo looks blurry. Please upload a sharper image taken in better light.";
  }
  if (lower.includes("faceverify_existing_face")) {
    return "We found a face match that needs manual review. Your account is waiting for admin approval.";
  }
  if (lower.includes("unauthoriz") || lower.includes("token")) {
    return "Your session has expired. Please sign in again.";
  }
  if (lower.includes("forbidden")) {
    return "You don't have permission to do that.";
  }
  if (lower.includes("already")) {
    if (lower.includes("email")) {
      return "That email is already registered.";
    }
    if (lower.includes("username")) {
      return "That username is already taken.";
    }
    if (lower.includes("whatsapp") || lower.includes("phone")) {
      return "That WhatsApp number is already linked to another account.";
    }
    return "That item already exists.";
  }
  if (lower.includes("required")) {
    return "Please complete the missing fields and try again.";
  }
  if (lower.includes("failed")) {
    return "We couldn't complete that request. Please try again.";
  }

  return message;
}

export function friendlyApiMessage(
  message: unknown,
  fallback = DEFAULT_MESSAGE,
): string {
  if (typeof message !== "string") return fallback;

  const trimmed = message.trim();
  if (!trimmed) return fallback;

  const cleaned = trimmed
    .replace(/\b(api|server|backend)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return fromStatusHint(cleaned);
}

export function friendlyApiError(
  error: unknown,
  fallback = DEFAULT_MESSAGE,
): string {
  if (typeof error === "string") return friendlyApiMessage(error, fallback);
  if (error instanceof Error) return friendlyApiMessage(error.message, fallback);
  return fallback;
}
