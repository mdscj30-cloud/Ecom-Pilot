"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TabId } from "@/lib/types";

interface CloudImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: (url: string) => void;
  type: TabId | null;
}

// This component is no longer used but is kept in case it's needed later.
export function CloudImportModal({
  isOpen,
  onClose,
  onSync,
  type,
}: CloudImportModalProps) {
  const [url, setUrl] = useState("");

  const handleSync = () => {
    if (url) {
      onSync(url);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link Google Sheet (CSV)</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="cloud-url">Public CSV URL</Label>
          <Input
            id="cloud-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.google.com/.../pub?output=csv"
          />
           <p className="text-xs text-muted-foreground">
            Go to your sheet, click File {'>'} Share {'>'} Publish to web. Select "Comma-separated values (.csv)" and copy the link.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSync}>
            Sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddSkuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sku: { name: string; channel: "Meesho" | "Amazon" }) => void;
}

export function AddSkuModal({ isOpen, onClose, onSave }: AddSkuModalProps) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"Meesho" | "Amazon">("Meesho");

  const handleSave = () => {
    if (name) {
      onSave({ name, channel });
      setName("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add SKU (Quick)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">SKU Name</Label>
            <Input
              id="new-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Baby Diapers NB (72 Pcs)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-channel">Channel</Label>
            <Select
              value={channel}
              onValueChange={(v: "Meesho" | "Amazon") => setChannel(v)}
            >
              <SelectTrigger id="new-channel">
                <SelectValue placeholder="Select a channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Meesho">Meesho</SelectItem>
                <SelectItem value="Amazon">Amazon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
