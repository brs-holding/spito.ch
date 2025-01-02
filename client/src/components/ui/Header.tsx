import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b">
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
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/patients">Patients</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/appointments">Appointments</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/" className="text-2xl font-bold tracking-tighter">
            SPITO.CH
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
  );
}
