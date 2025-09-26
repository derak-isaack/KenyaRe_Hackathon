import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';

import { 
  Settings as SettingsIcon, 
  Database, 
  AlertTriangle,
  Download,
  Upload,
  Mail,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

export function Settings() {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailStatus, setEmailStatus] = useState('not_connected'); // 'not_connected', 'connected', 'failed'
  const [isConnectingEmail, setIsConnectingEmail] = useState(false);

  const handleConfigure = (system) => {
    setIsConfiguring(true);
    console.log(`Configuring ${system}...`);
    setTimeout(() => {
      setIsConfiguring(false);
      alert(`${system} configuration updated successfully!`);
    }, 2000);
  };

  const handleSetup = (system) => {
    console.log(`Setting up ${system}...`);
    alert(`${system} setup initiated. Check your email for configuration details.`);
  };

  const handleManage = (system) => {
    console.log(`Managing ${system}...`);
    alert(`Opening ${system} management panel...`);
  };

  const handleEmailConnect = () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      setEmailStatus('failed');
      return;
    }

    setIsConnectingEmail(true);
    console.log(`Connecting email: ${emailAddress}`);
    
    // Simulate connection attempt
    setTimeout(() => {
      setIsConnectingEmail(false);
      // Simulate success/failure (80% success rate for demo)
      if (Math.random() > 0.2) {
        setEmailStatus('connected');
      } else {
        setEmailStatus('failed');
      }
    }, 2000);
  };

  const handleExport = () => {
    setIsExporting(true);
    console.log('Exporting system data...');
    setTimeout(() => {
      setIsExporting(false);
      const data = { timestamp: new Date().toISOString(), settings: {}, tickets: 143 };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'system_export.json';
      a.click();
      URL.revokeObjectURL(url);
      alert('System data exported successfully!');
    }, 1500);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setIsImporting(true);
        console.log('Importing configuration...');
        setTimeout(() => {
          setIsImporting(false);
          alert('Configuration imported successfully!');
        }, 2000);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="integration" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>



        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Database Connection</h4>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Claims database integration</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleConfigure('Database Connection')}
                    disabled={isConfiguring}
                  >
                    {isConfiguring ? 'Configuring...' : 'Configure'}
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Configuration
                    </h4>
                    <Badge className={
                      emailStatus === 'connected' ? 'bg-green-100 text-green-800' :
                      emailStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {emailStatus === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {emailStatus === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                      {emailStatus === 'connected' ? 'Successfully Connected' :
                       emailStatus === 'failed' ? 'Not Connected' :
                       'Not Configured'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Configure email notifications and alerts</p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="email-address">Email Address</Label>
                      <Input
                        id="email-address"
                        type="email"
                        placeholder="Enter your email address"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      size="sm" 
                      onClick={handleEmailConnect}
                      disabled={isConnectingEmail || !emailAddress}
                      className="w-full"
                    >
                      {isConnectingEmail ? 'Connecting...' : 'Connect Email'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {emailStatus === 'connected' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Email Configuration Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Email notifications are now active for {emailAddress}. You will receive alerts for:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                  <li>High-risk claims requiring urgent review</li>
                  <li>System alerts and maintenance notifications</li>
                  <li>Weekly fraud detection reports</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Data Management</h4>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleExport}
                      disabled={isExporting}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isExporting ? 'Exporting...' : 'Export System Data'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleImport}
                      disabled={isImporting}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isImporting ? 'Importing...' : 'Import Configuration'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">System Status</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">System Health</span>
                      <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Database Status</span>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Processing Queue</span>
                      <Badge className="bg-blue-100 text-blue-800">12 items</Badge>
                    </div>
                  </div>
                </div>
              </div>


            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}