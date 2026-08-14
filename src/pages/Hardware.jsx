import { useState } from "react";
import { ScanLine, Printer, Landmark, Monitor, Scale, Hand, Loader2 } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";

const INITIAL_DEVICES = [
  { id: 1, icon: ScanLine, name: "Barcode Scanner", detail: "Keyboard Wedge · Connected", online: true },
  { id: 2, icon: Printer, name: "Thermal Printer (80mm)", detail: "USB · Connected", online: true },
  { id: 3, icon: Landmark, name: "Cash Drawer", detail: "Triggered on Cash Payment", online: true },
  { id: 4, icon: Monitor, name: "Customer-Facing Display", detail: "COM3 · Not connected", online: false },
  { id: 5, icon: Scale, name: "Weighing Scale", detail: "COM4 · Not connected", online: false },
  { id: 6, icon: Hand, name: "Touch Screen", detail: "Calibrated", online: true },
];

export default function Hardware() {
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const [testingId, setTestingId] = useState(null);

  const handleTest = (id) => {
    setTestingId(id);
    setTimeout(() => {
      setDevices(prev => prev.map(d => {
        if (d.id === id) {
          return { ...d, online: true, detail: d.detail.replace("Not connected", "Connected") };
        }
        return d;
      }));
      setTestingId(null);
    }, 1500);
  };

  return (
    <div>
      <PageHeader eyebrow="System" title="Hardware Support" description="Everything runs offline — connect and test each device locally." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((d) => {
          const isTesting = testingId === d.id;
          return (
            <div key={d.name} className="bg-white border border-canvas-200 rounded-xl2 shadow-soft p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-lg bg-canvas-100 text-ink-600 flex items-center justify-center">
                  <d.icon size={16} />
                </div>
                <span className={`h-2 w-2 rounded-full ${d.online ? "bg-basil-500" : "bg-paprika-500"} ${isTesting ? "animate-ping" : ""}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-900">{d.name}</p>
                <p className="text-xs text-ink-500">{d.detail}</p>
              </div>
              <Button 
                variant={d.online ? "secondary" : "primary"} 
                size="sm" 
                onClick={() => handleTest(d.id)}
                disabled={isTesting}
              >
                {isTesting ? (
                  <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Testing...</span>
                ) : (
                  d.online ? "Test" : "Reconnect"
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
