import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegisterContainers } from '@/hooks/use-containers';

export default function QrGeneratorPage() {
  const registerMutation = useRegisterContainers();

  const [startNumber, setStartNumber] = useState(1000);
  const [count, setCount] = useState(50);
  const [baseUrl, setBaseUrl] = useState('https://app.tclab.io/c/');
  const [registerInSystem, setRegisterInSystem] = useState(false);
  const [generated, setGenerated] = useState<string[]>([]);
  const qrAreaRef = useRef<HTMLDivElement>(null);

  async function handleGenerate() {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(String(startNumber + i));
    }
    setGenerated(codes);
    toast.success(`Generated ${codes.length} QR codes`);

    if (registerInSystem) {
      try {
        await registerMutation.mutateAsync({ qrCodes: codes });
        toast.success(`Registered ${codes.length} containers in the system`);
      } catch {
        toast.error('Failed to register containers');
      }
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleExportPdf() {
    if (!qrAreaRef.current) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const margin = 10;
    const cols = 5;
    const qrSize = (pageWidth - 2 * margin) / cols;
    let x = margin;
    let y = margin;

    generated.forEach((code, i) => {
      if (i > 0 && i % cols === 0) {
        x = margin;
        y += qrSize + 5;
      }
      if (y + qrSize > 287) {
        doc.addPage();
        x = margin;
        y = margin;
      }

      // Draw a border box
      doc.setDrawColor(200);
      doc.rect(x, y, qrSize, qrSize);

      // Add QR code value text
      const val = getQrValue(code);
      doc.setFontSize(6);
      doc.text(code, x + qrSize / 2, y + qrSize - 2, { align: 'center' });

      x += qrSize;
    });

    doc.save('qr-codes.pdf');
    toast.success('PDF exported');
  }

  function getQrValue(code: string) {
    if (baseUrl.trim()) return `${baseUrl.trim()}${code}`;
    return code;
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .qr-print-area, .qr-print-area * { visibility: visible !important; }
          .qr-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">QR Code Generator</h2>

        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-700">Configuration</CardTitle>
            <CardDescription>Generate QR codes for printing on label sheets.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Start Number</Label>
                <Input type="number" value={startNumber} onChange={(e) => setStartNumber(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Count</Label>
                <Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} min={1} max={500} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Base URL <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="Leave empty for plain number" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input type="checkbox" id="registerInSystem" checked={registerInSystem} onChange={(e) => setRegisterInSystem(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="registerInSystem" className="cursor-pointer">Register in System</Label>
              <span className="text-xs text-gray-400">(also register as EMPTY containers via the API)</span>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button onClick={handleGenerate} disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'Generating...' : 'Generate'}
              </Button>
              {generated.length > 0 && (
                <>
                  <Button variant="outline" onClick={handlePrint}>Print</Button>
                  <Button variant="outline" onClick={handleExportPdf}>Export PDF</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {generated.length > 0 && (
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-700">
                Generated QR Codes ({generated.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={qrAreaRef} className="qr-print-area grid grid-cols-5 gap-0">
                {generated.map((code) => (
                  <div key={code} className="flex flex-col items-center justify-center border border-gray-200 bg-white p-3">
                    <QRCodeSVG value={getQrValue(code)} size={96} level="M" includeMargin={false} />
                    <span className="mt-1.5 text-xs font-bold font-mono text-gray-800">{code}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
