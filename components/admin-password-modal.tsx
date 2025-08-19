"use client";
import { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectTrigger,SelectValue,SelectGroup, SelectItem } from '@/components/ui/select';

interface AdminPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string, status: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export function AdminPasswordModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  loading = false,
  error 
}: AdminPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(password, status);
    setPassword(''); // Clear password after submission
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" />
            Admin Authentication Required
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Select
              value={status}
              onValueChange={e=>setStatus(e)}
            >
                <SelectTrigger className='mb-2'>
                  <SelectValue placeholder="schedule status" />
                </SelectTrigger>
              <SelectContent>
                 <SelectItem value='pending'>pending</SelectItem>
                 <SelectItem value='checked-in'>checked in</SelectItem>
                 <SelectItem value='no-show'>no show</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="admin-password">
              Enter admin password to modify schedule status:
            </Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!password || loading}
            >
              {loading ? 'Verifying...' : 'Confirm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}