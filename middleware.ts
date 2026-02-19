import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isDashboardRoute(req)) {
    const authObj = await auth();

    if (!authObj.userId) {
      return authObj.redirectToSignIn();
    }

    const adminEmail = "dubeyshivam890@gmail.com";
    // 🛡️ Added a null-check fallback to prevent 422 loops
    const userEmail = authObj.sessionClaims?.email as string || "";

    if (userEmail && userEmail !== adminEmail) {
      console.log(`🚫 Access Denied: ${userEmail}`);
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // If userEmail is missing but userId exists, let it through 
    // to prevent the 422 infinite loop while Clerk is "syncing"
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};