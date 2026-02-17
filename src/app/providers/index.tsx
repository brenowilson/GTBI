import { type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./ThemeProvider";
import { QueryProvider } from "./QueryProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <QueryProvider>{children}</QueryProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
