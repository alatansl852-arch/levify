import React from 'react';
import { useParams } from 'react-router-dom';
import PrintableLeaveForm from '@/components/PrintableLeaveForm';
import { useAuth } from '@/contexts/AuthContext';

export default function PrintLeaveForm() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  // Only OVCAF can print the leave form.
  if (user?.role !== 'ovcaf') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">
          Only OVCAF is allowed to print leave forms.
        </p>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No application specified.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto">
        <PrintableLeaveForm applicationId={parseInt(id, 10)} />
      </div>
    </div>
  );
}