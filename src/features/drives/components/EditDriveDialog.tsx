import React from "react";

import { EditDetailsDialog } from "@/components";

import { useDriveStore } from "../store/driveStore";

export type EditDriveDialogProps = {
  visible: boolean;
  driveId: string;
  onClose: () => void;
};

/** Rename a saved drive or rewrite its review — the after-the-fact counterpart to `SaveDriveDialog`. */
export function EditDriveDialog({ visible, driveId, onClose }: EditDriveDialogProps) {
  const drive = useDriveStore((state) => state.pastDrives.find((candidate) => candidate.id === driveId));
  const updateDriveDetails = useDriveStore((state) => state.updateDriveDetails);

  if (!drive) return null;

  return (
    <EditDetailsDialog
      visible={visible}
      title="Edit drive"
      nameLabel="Drive name"
      reviewLabel="Notes / review"
      initialName={drive.name}
      initialReview={drive.review}
      onSave={(details) => updateDriveDetails(drive.id, details)}
      onClose={onClose}
    />
  );
}
