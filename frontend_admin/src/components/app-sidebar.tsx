'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Store,
  ChevronRight,
  Loader2,
  Settings,
} from 'lucide-react';
import { marketplacesAPI } from '@/lib/api';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function AppSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  const { data: marketplaces, isLoading } = useQuery({
    queryKey: ['marketplaces'],
    queryFn: marketplacesAPI.list,
  });

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/marketplaces" className="flex items-center gap-2 font-semibold">
          <Store className="h-6 w-6" />
          <span>Marketplace Admin</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Marketplaces - collapsible with submenu */}
              <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={pathname.startsWith('/marketplaces')}
                      className="w-full"
                    >
                      <Store className="h-4 w-4" />
                      <span>Маркетплейсы</span>
                      <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {isLoading ? (
                        <SidebarMenuSubItem>
                          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Загрузка...
                          </div>
                        </SidebarMenuSubItem>
                      ) : marketplaces && marketplaces.length > 0 ? (
                        marketplaces.map((mp) => (
                          <SidebarMenuSubItem key={mp.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === `/marketplaces/${mp.id}`}
                            >
                              <Link href={`/marketplaces/${mp.id}`}>
                                <span className={`w-2 h-2 rounded-full mr-2 ${mp.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                                {mp.name}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))
                      ) : (
                        <SidebarMenuSubItem>
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Нет маркетплейсов
                          </div>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Settings - direct link */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/settings'}
                >
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Настройки</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
