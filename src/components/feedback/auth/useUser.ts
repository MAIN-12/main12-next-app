import { useUser as auth0UseUser } from "@auth0/nextjs-auth0/client";

interface User {
    id: string;
    name: string;
    email: string;
    isAnonymous: boolean;
}

export function useUser() {
    try {
        const auth0User = auth0UseUser();
        if (auth0User?.user) {
            return {
                user: {
                    id: auth0User.user.sub || "unknown",
                    name: auth0User.user.name || "Guest User",
                    email: auth0User.user.email || "guest@example.com",
                    isAnonymous: false,
                },
            };
        }
    } catch (error) {
        console.error("Auth error:", error);
    }

    // Return an object with an anonymous user
    return {
        user: {
            id: "anonymous",
            name: "Anonymous",
            email: "anonymous@example.com",
            isAnonymous: true,
        },
    };
}
