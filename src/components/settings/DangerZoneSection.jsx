import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import DeleteAccountDialog from '@/components/nav/DeleteAccountDialog.jsx';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SectionHeader from './SectionHeader.jsx';

export default function DangerZoneSection() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <div className="mt-8 mb-6">
        <GlassPanel className="p-4" style={{ borderColor: 'hsla(0,80%,50%,0.15)' }}>
          <SectionHeader
            icon={Trash2}
            iconColor="text-rose-400"
            title="Danger Zone"
            subtitle="Permanently delete your account and all associated field data. This action cannot be undone."
          />
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="ml-9 px-4 py-2.5 rounded-xl text-rose-400 text-sm font-semibold transition active:scale-95 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70 motion-reduce:transform-none"
            style={{ background: 'hsla(0,80%,50%,0.08)', border: '1px solid hsla(0,80%,50%,0.22)' }}
          >
            Delete Account
          </button>
        </GlassPanel>
      </div>
      {showDeleteDialog && <DeleteAccountDialog onClose={() => setShowDeleteDialog(false)} />}
    </>
  );
}
