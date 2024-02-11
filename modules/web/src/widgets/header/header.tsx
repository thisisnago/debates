"use client";

import { SignOutAction, useWhoami } from "@/features/auth";
import { cl } from "@/shared/lib/cl";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    {
        href: "/",
        label: "Home",
        protect: false
    },
    {
        href: "/dashboard",
        label: "Dashboard",
        protect: true
    },
    {
        href: "/sign-up",
        label: "Sign Up",
        protect: false,
        hideIfLogged: true
    },
    {
        href: "/sign-in",
        label: "Sign In",
        protect: false,
        hideIfLogged: true
    },
];

export function Header(): JSX.Element {
    const { data } = useWhoami();
    const pathname = usePathname();
    const isLoggedIn = data?.data?.id;

    return (
        <header>
            <nav className="flex gap-2">
                {navItems.map((item) => {
                    if ((isLoggedIn && item.hideIfLogged) || (!isLoggedIn && item.protect)) {
                        return null;
                    }

                    return (
                        <Link href={item.href} key={item.href} className={cl(pathname === item.href && "font-bold")}>
                            {item.label}
                        </Link>
                    );
                })}
                <SignOutAction />
            </nav>
        </header>
    );
}