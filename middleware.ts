import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  
  if (isDashboardRoute(req)) {
    // 1. Force login if not authenticated
    if (!userId) {
      return (await auth()).redirectToSignIn();
    }

    // 2. Admin Check
    const userEmail = sessionClaims?.email as string;
    const adminEmail = "dubeyshivam890@gmail.com"; 

    if (userEmail !== adminEmail) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
});

export const config = {
  matcher: [
    // Ensure /api/webhook is NOT blocked by Clerk
    '/((?!_next|api/webhook|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};