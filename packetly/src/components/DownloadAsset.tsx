"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

interface Version {
  version_number: number;
  file_url: string;
  timestamp: string;
}

interface DownloadAssetModalProps {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
}

export default function DownloadAssetModal({ assetId, open, onOpenChange, token }: DownloadAssetModalProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`https://usabilidadaccesibilidad-25.onrender.com/api/assets/${assetId}/versions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setVersions(data))
      .finally(() => setLoading(false));
  }, [assetId, token, open]);

  const versionObj = versions.find(v => String(v.version_number) === selectedVersion);

  const handleDownload = () => {
    if (!versionObj) return;
    let fileUrl = versionObj.file_url;
    if (!/^https?:\/\//.test(fileUrl)) {
      fileUrl = `https://usabilidadaccesibilidad-25.onrender.com${fileUrl}`;
    }
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileUrl.split("/").pop() || "asset";
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Asset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="version" className="block text-sm font-medium mb-1">
              Version
            </label>
            <Select value={selectedVersion} onValueChange={setSelectedVersion} disabled={loading || versions.length === 0}>
              <SelectTrigger id="version">
                <SelectValue placeholder={loading ? "Loading..." : "Select version"} />
              </SelectTrigger>
              <SelectContent>
                {versions.map(v => (
                  <SelectItem key={v.version_number} value={String(v.version_number)}>
                    Version {v.version_number} ({new Date(v.timestamp).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleDownload}
            disabled={!selectedVersion}
            className="w-full"
          >
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
