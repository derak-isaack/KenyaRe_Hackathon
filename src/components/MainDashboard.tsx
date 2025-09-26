import React, { useState } from 'react';
import { TicketFeed } from './TicketFeed';
import { ReclaimedClaims } from './ReclaimedClaims';
import { CompanyRisk } from './CompanyRisk';
import { Analytics } from './Analytics';
import { Settings } from './Settings';

import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarInset, SidebarTrigger } from './ui/sidebar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Shield, FileText, RotateCcw, Building2, BarChart3, Settings as SettingsIcon, LogOut, Bell, User } from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';


export function MainDashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState('tickets');
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  
  // Static menu items (no real-time badges)
  const menuItems = [
    { id: 'tickets', label: 'Tickets', icon: FileText, badge: '23' },
    { id: 'reclaimed', label: 'Reclaimed Claims', icon: RotateCcw, badge: '7' },
    { id: 'companies', label: 'Company Risk', icon: Building2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleRunAnalysis = async () => {
    setIsRunningAnalysis(true);
    
    try {
      // Import the API service
      const { apiService } = await import('../services/api');
      const response = await apiService.runAnalysis();
      
      if (response.status === 'success') {
        const data = response.data || {};
        
        // Show success message
        const successMessage = data.reports_generated > 0 
          ? `Analysis completed! Generated ${data.reports_generated} new reports`
          : `Analysis completed! Processed ${data.total_reports || 0} total reports`;
          
        alert(successMessage);
        
        // Trigger a refresh of the current view data
        window.dispatchEvent(new CustomEvent('refreshData'));
        
      } else {
        alert('Analysis failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Network error during analysis');
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'tickets':
        return <TicketFeed />;
      case 'reclaimed':
        return <ReclaimedClaims />;
      case 'companies':
        return <CompanyRisk />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <TicketFeed />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r bg-white">
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">Hakika claims</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveView(item.id)}
                    isActive={activeView === item.id}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <div>
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs">{user.role}</div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="w-full justify-start text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-gray-900">
                  {menuItems.find(item => item.id === activeView)?.label || 'Dashboard'}
                </h1>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleRunAnalysis}
                  disabled={isRunningAnalysis}
                  className="flex items-center gap-2"
                >
                  {isRunningAnalysis ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Run Analysis
                    </>
                  )}
                </Button>
                

              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}