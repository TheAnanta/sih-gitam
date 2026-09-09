"use client";

import { LogIn, LogOut } from "lucide-react";
import type { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AuthButton({
  user,
  loading,
  onSignIn,
  onSignOut,
}: {
  user: User | null;
  loading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  if (loading) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-muted" aria-hidden="true" />;
  }

  if (!user || user.isAnonymous) {
    return (
      <Button variant="outline" size="sm" className="h-9 gap-1.5 px-3" onClick={onSignIn}>
        <LogIn className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Sign in</span>
      </Button>
    );
  }

  const initials = (user.displayName ?? user.email ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-0.5">
            <span className="text-sm font-medium">{user.displayName}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
