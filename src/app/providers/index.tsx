import { type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./ThemeProvider";
import { QueryProvider } from "./QueryProvider";
import { AuthInitializer } from "./AuthInitializer";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <QueryProvider>
          <AuthInitializer>{children}</AuthInitializer>
        </QueryProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
