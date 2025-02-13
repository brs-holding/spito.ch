import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { User } from "@db/schema";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  Settings,
  LogOut,
  UserPlus,
  Receipt,
} from "lucide-react";
import { Link } from "wouter";
import { t } from "@/lib/i18n";

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const { logout } = useUser();

  return (
    <div className="w-64 bg-white border-r h-screen p-4">
      <div className="space-y-4">
        <div className="flex items-center space-x-2 px-2 py-4">
          <img
            src="https://images.unsplash.com/photo-1579154341140-5aa3a445d43b"
            alt="Healthcare Logo"
            className="w-8 h-8 rounded-full"
          />
          <div>
            <h2 className="font-semibold">{user.fullName}</h2>
            <p className="text-sm text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>

        <nav className="space-y-2">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('navigation.dashboard')}
            </Button>
          </Link>

          {user.role === "spitex_org" && (
            <Link href="/employees">
              <Button variant="ghost" className="w-full justify-start">
                <UserPlus className="mr-2 h-4 w-4" />
                {t('navigation.employees')}
              </Button>
            </Link>
          )}

          <Link href="/patients">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              {t('navigation.patients')}
            </Button>
          </Link>

          <Link href="/care-plans">
            <Button variant="ghost" className="w-full justify-start">
              <ClipboardList className="mr-2 h-4 w-4" />
              {t('navigation.carePlans')}
            </Button>
          </Link>

          <Link href="/schedule">
            <Button variant="ghost" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              {t('navigation.schedule')}
            </Button>
          </Link>

          <Link href="/billing">
            <Button variant="ghost" className="w-full justify-start">
              <Receipt className="mr-2 h-4 w-4" />
              {t('navigation.billing')}
            </Button>
          </Link>

          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              {t('navigation.settings')}
            </Button>
          </Link>
        </nav>

        <div className="absolute bottom-4 w-56">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => logout()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </div>
  );
}