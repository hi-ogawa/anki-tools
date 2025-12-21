"use client";

import { Header } from "@/components/refine-ui/layout/header";
import { ThemeProvider } from "@/components/refine-ui/theme/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { PropsWithChildren, ReactNode } from "react";
import { Sidebar } from "./sidebar";

interface LayoutProps extends PropsWithChildren {
  modelSelector?: ReactNode;
}

export function Layout({ children, modelSelector }: LayoutProps) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <Sidebar />
        <SidebarInset>
          <Header modelSelector={modelSelector} />
          <main
            className={cn(
              "@container/main",
              "container",
              "mx-auto",
              "relative",
              "w-full",
              "flex",
              "flex-col",
              "flex-1",
              "px-2",
              "pt-4",
              "md:p-4",
              "lg:px-6",
              "lg:pt-6"
            )}
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

Layout.displayName = "Layout";
