import * as React from "react";

export type SidebarContextState = "expanded" | "collapsed";

export interface SidebarContextValue {
  state: SidebarContextState;
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

export const SidebarContext = React.createContext<SidebarContextValue | null>(null);
