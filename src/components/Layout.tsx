import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Outlet, Link } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { Toaster } from './ui/toaster';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { User, LogOut, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useState } from 'react';

const Layout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    // The ProtectedRoute will automatically redirect to login
  };

  const NavContent = () => (
    <>
      <div className="flex items-center gap-4">
        <Link to="/streams" className="text-lg font-semibold">
          Streams
        </Link>
        {/* Add more nav links here */}
      </div>
    </>
  );

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">
              {user?.firstname} {user?.lastname}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Only show navigation elements when not on login page
  const shouldShowNav = location.pathname !== '/login';

  return (
    <div className="min-h-screen flex flex-col">
      {shouldShowNav && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              {!isDesktop && (
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[240px] sm:w-[280px]">
                    <div className="flex flex-col gap-4">
                      <NavContent />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              <Link to="/" className="flex items-center gap-2">
                <h1 className="text-xl font-bold">MediaSoup Test</h1>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {isDesktop && <NavContent />}
              <UserMenu />
            </div>
          </div>
        </header>
      )}

      <main className="flex-1">
        <Toaster />
        {location.pathname === '/login' ? (
          <Outlet />
        ) : (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        )}
      </main>
    </div>
  );
};

export default Layout;
