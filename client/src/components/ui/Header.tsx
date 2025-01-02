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
import CarePlansDialog from "./CarePlansDialog";
import ScheduleDialog from "./ScheduleDialog";
import SettingsDialog from "./SettingsDialog";

export default function Header() {
  const [openDialog, setOpenDialog] = useState<'carePlans' | 'schedule' | 'settings' | null>(null);

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
                  Care Plans
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setOpenDialog('schedule')}>
                  Schedule
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/patients">Patients</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/appointments">Appointments</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setOpenDialog('settings')}>
                  Settings
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

          {/* Auth Links */}
          <div className="flex items-center space-x-4">
            <Link href="/pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
            <Link href="/login" className="text-sm font-medium hover:text-primary">
              Login
            </Link>
            <Link href="/register">
              <Button size="sm">Register</Button>
            </Link>
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