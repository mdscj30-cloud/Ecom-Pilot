"use client";

import { Button } from "@/components/ui/button";
import {
  CloudLightning,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  RotateCcw,
  User as UserIcon,
} from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  onReset: () => void;
  onSyncAll: () => void;
}

export default function Header({ onReset, onSyncAll }: HeaderProps) {
  const { user } = useUser();
  const auth = useAuth();

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <span className="flex items-center justify-center bg-primary/10 text-primary rounded-lg p-2">
            <LayoutDashboard className="w-6 h-6" />
          </span>
          Unified Command Center
        </h1>
        <p className="text-muted-foreground text-xs mt-1 font-medium ml-14">
          Multi-Channel Operations • Location-Wise Inventory • Advanced Growth
          Analytics
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs bg-card p-2 rounded-lg border shadow-sm">
          <Button size="sm" variant="outline" className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 font-bold" onClick={onSyncAll}>
            <CloudLightning className="mr-1.5 h-3.5 w-3.5" />
            Sync All
          </Button>
          <div className="h-5 w-px bg-border" />
          <Button size="sm" variant="secondary">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh View
          </Button>
          <div className="h-5 w-px bg-border" />
          <Button size="sm" variant="ghost" className="text-destructive-foreground bg-destructive/80 hover:bg-destructive" onClick={onReset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? ""} />
                  <AvatarFallback>{user.displayName?.charAt(0) ?? <UserIcon />}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
