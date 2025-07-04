// Defining types separately for clarity, can be merged with context file if preferred

export type SidebarTheme = "dark" | "light" | "system"; // Example, if theme was part of context

export type SidebarState = "expanded" | "collapsed";

export type SidebarContextValue = {
  state: SidebarState;
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};
