"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import useOBDII from "@/hooks/useOBDII";
import { Input } from "@/components/ui/input";

export default function Home() {
  const { status, data: obdData, error, scanBluetooth, connectWiFi, disconnect } = useOBDII();
  const [ipAddress, setIpAddress] = useState("192.168.1.1");
  const [port, setPort] = useState("35000");

  const handleBluetoothConnect = () => {
    scanBluetooth();
  };

  const handleWifiConnect = () => {
    connectWiFi(ipAddress, parseInt(port));
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-4xl font-bold text-center">OBD-II Scanner</h1>
        <p className="text-gray-500 mt-2">Conecte su dispositivo ELM327 vía Bluetooth o WiFi</p>
      </div>
      
      <Tabs defaultValue="bluetooth" className="w-full max-w-3xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bluetooth">Bluetooth</TabsTrigger>
          <TabsTrigger value="wifi">WiFi</TabsTrigger>
        </TabsList>

        <TabsContent value="bluetooth" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Conectar por Bluetooth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={handleBluetoothConnect}
                  disabled={status === "connecting"}
                  className="w-full"
                >
                  {status === "connecting" ? "Conectando..." : "Buscar Dispositivos"}
                </Button>
                {status === "connected" && (
                  <Button 
                    onClick={handleDisconnect}
                    variant="destructive"
                    className="w-full"
                  >
                    Desconectar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wifi" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Conectar por WiFi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
              <Input
                type="text"
                placeholder="IP Address"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="mb-2"
              />
              <Input
                type="number"
                placeholder="Port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="mb-4"
              />
              <div className="space-y-4">
                <Button 
                  onClick={handleWifiConnect}
                  disabled={status === "connecting"}
                  className="w-full"
                >
                  {status === "connecting" ? "Conectando..." : "Conectar"}
                </Button>
                {status === "connected" && (
                  <Button 
                    onClick={handleDisconnect}
                    variant="destructive"
                    className="w-full"
                  >
                    Desconectar
                  </Button>
                )}
              </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {status === "connected" && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>RPM</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{obdData?.rpm || "0"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Velocidad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{obdData?.speed || "0"} km/h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Temperatura del Motor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{obdData?.engineTemp || "0"}°C</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Códigos de Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{obdData?.dtc?.length || "0"} códigos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-4 max-w-3xl mx-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
