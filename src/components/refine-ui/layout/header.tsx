import type { ReactNode } from "react";
import {
  useRefineOptions,
  useActiveAuthProvider,
  useLogout,
} from "@refinedev/core";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/refine-ui/theme/theme-toggle";
import { UserAvatar } from "@/components/refine-ui/layout/user-avatar";
import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  modelSelector?: ReactNode;
}

export const Header = ({ modelSelector }: HeaderProps) => {
  const { isMobile } = useSidebar();

  return <>{isMobile ? <MobileHeader modelSelector={modelSelector} /> : <DesktopHeader modelSelector={modelSelector} />}</>;
};

function DesktopHeader({ modelSelector }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky",
        "top-0",
        "flex",
        "h-16",
        "shrink-0",
        "items-center",
        "gap-4",
        "border-b",
        "border-border",
        "bg-sidebar",
        "px-4",
        "justify-between",
        "z-40"
      )}
    >
      <div className="flex items-center gap-2">
        {modelSelector}
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserDropdown />
      </div>
    </header>
  );
}

function MobileHeader({ modelSelector }: HeaderProps) {
  const { open, isMobile } = useSidebar();

  const { title } = useRefineOptions();

  return (
    <header
      className={cn(
        "sticky",
        "top-0",
        "flex",
        "h-12",
        "shrink-0",
        "items-center",
        "gap-2",
        "border-b",
        "border-border",
        "bg-sidebar",
        "pr-3",
        "justify-between",
        "z-40"
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger
          className={cn("text-muted-foreground", "rotate-180", "ml-1", {
            "opacity-0": open,
            "opacity-100": !open || isMobile,
            "pointer-events-auto": !open || isMobile,
            "pointer-events-none": open && !isMobile,
          })}
        />
        {modelSelector}
      </div>

      <div
        className={cn(
          "whitespace-nowrap",
          "flex",
          "flex-row",
          "h-full",
          "items-center",
          "justify-start",
          "gap-2",
          "transition-discrete",
          "duration-200",
          {
            "pl-3": !open,
            "pl-5": open,
          }
        )}
      >
        <div>{title.icon}</div>
        <h2
          className={cn(
            "text-sm",
            "font-bold",
            "transition-opacity",
            "duration-200",
            {
              "opacity-0": !open,
              "opacity-100": open,
            }
          )}
        >
          {title.text}
        </h2>
      </div>

      <ThemeToggle className={cn("h-8", "w-8")} />
    </header>
  );
}

const UserDropdown = () => {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const authProvider = useActiveAuthProvider();

  if (!authProvider?.getIdentity) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            logout();
          }}
        >
          <LogOutIcon
            className={cn("text-destructive", "hover:text-destructive")}
          />
          <span className={cn("text-destructive", "hover:text-destructive")}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

Header.displayName = "Header";
MobileHeader.displayName = "MobileHeader";
DesktopHeader.displayName = "DesktopHeader";
