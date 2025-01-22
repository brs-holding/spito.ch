import { useState } from "react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Logo } from "./Logo";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useUser } from "@/hooks/use-user";
import CarePlansDialog from "./CarePlansDialog";
import ScheduleDialog from "./ScheduleDialog";
import SettingsDialog from "./SettingsDialog";

export default function Header() {
  const [openDialog, setOpenDialog] = useState<'carePlans' | 'schedule' | 'settings' | null>(null);
  const { user } = useUser();

  return (
    <>
      <header className="border-b fixed w-full bg-background z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Navigation Links */}
          <nav className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => setOpenDialog('carePlans')}>
                  Pflegepläne
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setOpenDialog('schedule')}>
                  Terminplan
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/patients">Patienten</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/appointments">Termine</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setOpenDialog('settings')}>
                  Einstellungen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/">
              <Logo size="sm" />
            </Link>
          </div>

          {/* Auth Links & Notifications */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <NotificationCenter />
                <Button variant="outline" size="sm" asChild>
                  <Link href="/logout">Abmelden</Link>
                </Button>
              </>
            ) : (
              <>
                <Link href="/pricing" className="text-sm font-medium hover:text-primary">
                  Preise
                </Link>
                <Link href="/login" className="text-sm font-medium hover:text-primary">
                  Anmelden
                </Link>
                <Link href="/register">
                  <Button size="sm">Registrieren</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Dialogs */}
      <CarePlansDialog 
        open={openDialog === 'carePlans'} 
        onClose={() => setOpenDialog(null)} 
      />
      <ScheduleDialog 
        open={openDialog === 'schedule'} 
        onClose={() => setOpenDialog(null)} 
      />
      <SettingsDialog 
        open={openDialog === 'settings'} 
        onClose={() => setOpenDialog(null)} 
      />
    </>
  );
}