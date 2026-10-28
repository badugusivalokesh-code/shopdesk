import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { createPortal } from "react-dom";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Button, useToast } from "@/components/ui";

type IconProps = {
  className?: string;
};

type IconComponent = ComponentType<IconProps>;

type NavigationItem = {
  icon: IconComponent;
  label: string;
  to: string;
};

const navigationItems: NavigationItem[] = [
  { icon: DashboardIcon, label: "Dashboard", to: "/dashboard" },
  { icon: ProductsIcon, label: "Products", to: "/products" },
  { icon: OrdersIcon, label: "Orders", to: "/orders" },
  { icon: ProfileIcon, label: "Profile", to: "/profile" },
];

const pageMetadata = {
  "/dashboard": { breadcrumb: "Dashboard", title: "Dashboard" },
  "/products": { breadcrumb: "Products", title: "Products" },
  "/orders": { breadcrumb: "Orders", title: "Orders" },
  "/profile": { breadcrumb: "Profile", title: "Profile" },
} as const;

export default function DashboardLayout() {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const { info } = useToast();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profileMenuPosition, setProfileMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const hasOpenedSidebar = useRef(false);
  const page =
    pageMetadata[pathname as keyof typeof pageMetadata] ??
    pageMetadata["/dashboard"];
  const displayName = user?.name.trim() || user?.email || "ShopDesk user";
  const displayEmail = user?.email || "";
  const initials = getInitials(displayName);

  function handleThemeToggle() {
    const nextTheme = theme === "light" ? "dark" : "light";
    toggleTheme();
    info({
      title: `${nextTheme === "dark" ? "Dark" : "Light"} theme enabled`,
      description: "Your theme preference is saved for this device.",
    });
  }

  function handleLogout() {
    logout();
    closeSidebar();
    setIsProfileMenuOpen(false);
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    function updateProfileMenuPosition() {
      const button = profileMenuButtonRef.current;
      if (!button) {
        return;
      }

      const rect = button.getBoundingClientRect();
      setProfileMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        !profileMenuButtonRef.current?.contains(target) &&
        !profileMenuRef.current?.contains(target)
      ) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    }

    updateProfileMenuPosition();
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateProfileMenuPosition);
    window.addEventListener("scroll", updateProfileMenuPosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateProfileMenuPosition);
      window.removeEventListener("scroll", updateProfileMenuPosition, true);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!isSidebarOpen) {
      if (hasOpenedSidebar.current) {
        menuButtonRef.current?.focus({ preventScroll: true });
        hasOpenedSidebar.current = false;
      }
      return;
    }

    hasOpenedSidebar.current = true;
    closeButtonRef.current?.focus({ preventScroll: true });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-page">
      {isSidebarOpen ? (
        <button
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-overlay backdrop-blur-[2px] md:hidden"
          onClick={closeSidebar}
          type="button"
        />
      ) : null}

      <aside
        aria-label="Primary navigation"
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[min(19rem,calc(100vw-1.5rem))] flex-col overflow-y-auto border-r border-border bg-sidebar shadow-card transition-transform duration-200 ease-out dark:shadow-card-dark md:w-64 md:translate-x-0 md:shadow-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        id="shopdesk-sidebar"
      >
        <div className="flex min-h-0 flex-1 flex-col px-4 py-5 sm:px-5 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <NavLink
              aria-label="ShopDesk dashboard"
              className="flex min-w-0 items-center gap-3 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              onClick={closeSidebar}
              to="/dashboard"
            >
              <ShopDeskMark />
              <span className="truncate text-xl font-bold tracking-tight text-text-primary">
                ShopDesk
              </span>
            </NavLink>

            <button
              aria-label="Close navigation menu"
              className="rounded-control p-2 text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar md:hidden"
              onClick={closeSidebar}
              ref={closeButtonRef}
              type="button"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="my-7 h-px bg-border" />

          <nav aria-label="Main navigation" className="min-h-0 flex-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
              Menu
            </p>
            <div className="mt-3 space-y-1">
              {navigationItems.map(({ icon: Icon, label, to }) => (
                <NavLink
                  className={({ isActive }) =>
                    `group flex min-h-11 items-center gap-3 rounded-control px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
                      isActive
                        ? "bg-brand text-brand-foreground shadow-card"
                        : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                    }`
                  }
                  end={to === "/dashboard"}
                  key={to}
                  onClick={closeSidebar}
                  to={to}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </nav>

          <div className="mt-7 space-y-4">
            <div className="rounded-panel bg-surface-secondary p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
                Workspace
              </p>
              <p className="mt-2 text-sm font-semibold text-text-primary">
                ShopDesk workspace
              </p>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                Manage your store from one place.
              </p>
            </div>

            <Button
              aria-label="Sign out"
              className="w-full justify-start px-3 py-3 text-left text-sm font-semibold"
              onClick={handleLogout}
              size="sm"
              variant="outline"
            >
              <LogoutIcon className="h-5 w-5 shrink-0" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen min-w-0 md:ml-64">
        <header className="sticky top-0 z-30 border-b border-border bg-surface">
          <div className="mx-auto flex min-h-[4.75rem] w-full max-w-[1440px] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
            <button
              aria-controls="shopdesk-sidebar"
              aria-expanded={isSidebarOpen}
              aria-label="Open navigation menu"
              className="shrink-0 rounded-control p-2 text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-page md:hidden"
              onClick={() => setIsSidebarOpen(true)}
              ref={menuButtonRef}
              type="button"
            >
              <MenuIcon className="h-6 w-6" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium text-text-tertiary">
                <span>Pages</span>
                <ChevronRightIcon className="h-3.5 w-3.5" />
                <span className="truncate text-text-secondary">
                  {page.breadcrumb}
                </span>
              </div>
              <h1 className="mt-1 truncate text-xl font-bold leading-tight tracking-tight text-text-primary sm:text-2xl">
                {page.title}
              </h1>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
              <Button
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                aria-pressed={theme === "dark"}
                className="bg-surface-secondary px-2 text-text-secondary hover:bg-surface hover:text-text-primary focus-visible:ring-offset-page sm:px-3"
                onClick={handleThemeToggle}
                size="sm"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                variant="outline"
              >
                {theme === "light" ? (
                  <MoonIcon className="h-5 w-5" />
                ) : (
                  <SunIcon className="h-5 w-5" />
                )}
                <span className="hidden text-xs font-semibold sm:inline">
                  {theme === "light" ? "Dark mode" : "Light mode"}
                </span>
              </Button>

              <div className="relative">
                <button
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                  aria-label={`User menu for ${displayName}`}
                  className="flex items-center gap-2 rounded-control p-1.5 transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-page sm:gap-3 sm:pr-2"
                  onClick={() => {
                    if (isProfileMenuOpen) {
                      setIsProfileMenuOpen(false);
                      return;
                    }

                    const rect = profileMenuButtonRef.current?.getBoundingClientRect();
                    if (rect) {
                      setProfileMenuPosition({
                        top: rect.bottom + 8,
                        right: window.innerWidth - rect.right,
                      });
                      setIsProfileMenuOpen(true);
                    }
                  }}
                  ref={profileMenuButtonRef}
                  type="button"
                >
                  <span
                    aria-label={`Avatar for ${displayName}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground ring-4 ring-brand/10"
                    role="img"
                  >
                    {initials}
                  </span>
                  <span className="hidden min-w-0 text-left sm:block">
                    <span className="block max-w-40 truncate text-sm font-bold text-text-primary">
                      {displayName}
                    </span>
                    <span className="block max-w-40 truncate text-xs text-text-tertiary">{displayEmail}</span>
                  </span>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-text-tertiary transition-transform duration-150 ${
                      isProfileMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isProfileMenuOpen && profileMenuPosition
                  ? createPortal(
                    <div
                      aria-label="User menu"
                      className="fixed z-[100] w-56 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-card border border-border bg-surface p-2 shadow-card dark:shadow-card-dark"
                      ref={profileMenuRef}
                      role="menu"
                      style={{
                        maxHeight: `calc(100dvh - ${profileMenuPosition.top}px - 0.5rem)`,
                        right: profileMenuPosition.right,
                        top: profileMenuPosition.top,
                      }}
                    >
                      <div className="border-b border-border px-3 py-2 sm:hidden">
                        <p className="truncate text-sm font-bold text-text-primary">{displayName}</p>
                        {displayEmail ? (
                          <p className="truncate text-xs text-text-tertiary">{displayEmail}</p>
                        ) : null}
                      </div>

                      <div className="py-1">
                        <NavLink
                          className="flex min-h-11 items-center gap-2.5 rounded-control px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
                          onClick={() => setIsProfileMenuOpen(false)}
                          role="menuitem"
                          to="/profile"
                        >
                          <ProfileIcon className="h-4 w-4 shrink-0" />
                          <span>Profile</span>
                        </NavLink>

                        <button
                          className="flex min-h-11 w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
                          onClick={handleLogout}
                          role="menuitem"
                          type="button"
                        >
                          <LogoutIcon className="h-4 w-4 shrink-0" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>,
                    document.body,
                  )
                  : null}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] min-w-0 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return initials || "SD";
}

function ShopDeskMark() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand text-brand-foreground shadow-card">
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5v-11Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M8.5 9.5h7M8.5 12h7M8.5 14.5h4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.7"
        />
      </svg>
    </span>
  );
}

function DashboardIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.7" width="6.5" x="4" y="4" />
      <rect height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.7" width="6.5" x="13.5" y="4" />
      <rect height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.7" width="6.5" x="4" y="13.5" />
      <rect height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.7" width="6.5" x="13.5" y="13.5" />
    </svg>
  );
}

function ProductsIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m4.5 8.5 7.5 4 7.5-4M12 12.5V20M18.35 5.05 12.7 2.16a1.55 1.55 0 0 0-1.4 0L5.65 5.05A1.55 1.55 0 0 0 4.8 6.43v6.14c0 .58.32 1.1.83 1.38l5.64 3.09a1.55 1.55 0 0 0 1.46 0l5.64-3.09c.51-.28.83-.8.83-1.38V6.43c0-.58-.32-1.1-.85-1.38Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function OrdersIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 4.5h12v15H6v-15ZM9 8h6M9 11.5h6M9 15h3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path d="M8.5 4.5v-1h7v1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function ProfileIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5 19.25c.73-3.02 3.36-5 7-5s6.27 1.98 7 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function LogoutIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H14M11 12h8m0 0-3-3m3 3-3 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MenuIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CloseIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MoonIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.1 15.1A8.5 8.5 0 0 1 8.9 3.9 8.5 8.5 0 1 0 20.1 15.1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SunIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3v1.5M12 19.5V21M21 12h-1.5M4.5 12H3M18.36 5.64l-1.06 1.06M6.7 17.3l-1.06 1.06M18.36 18.36l-1.06-1.06M6.7 6.7 5.64 5.64"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m9 5 7 7-7 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
