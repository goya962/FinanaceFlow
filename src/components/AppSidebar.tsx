"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CreditCard,
  TrendingUp,
  PiggyBank,
  Landmark,
  Wallet,
  Settings,
  Menu,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { FinanceFlowLogo } from "./icons";

const menuItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/gastos", label: "Gastos", icon: CreditCard },
  { href: "/ingresos", label: "Ingresos", icon: TrendingUp },
  { href: "/ahorros", label: "Ahorros", icon: PiggyBank },
  { href: "/bancos", label: "Bancos", icon: Landmark },
  { href: "/tarjetas", label: "Tarjetas", icon: CreditCard },
  { href: "/billeteras", label: "Billeteras", icon: Wallet },
  { href: "/asistente-ia", label: "Asistente AI", icon: Sparkles },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50" onClick={() => setOpenMobile(true)}>
          <Menu />
      </Button>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <FinanceFlowLogo className="w-8 h-8 text-primary" />
            <span className="text-xl font-semibold group-data-[collapsible=icon]:hidden">
              FinanceFlow
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  as={Link}
                  href={item.href}
                  isActive={pathname === item.href}
                  onClick={handleLinkClick}
                  tooltip={{
                    children: item.label,
                    side: "right",
                    align: "center",
                  }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="group-data-[collapsible=icon]:hidden">
            <p className="text-xs text-muted-foreground">&copy; 2024 FinanceFlow</p>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
