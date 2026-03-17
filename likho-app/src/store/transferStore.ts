import { create } from 'zustand';
import type { SpaceType } from '@/types/workspace';

export type TransferStatus = 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface TransferJob {
  id: string;
  type: 'note' | 'folder';
  sourceName: string;
  fromSpace: SpaceType;
  toSpace: SpaceType;
  status: TransferStatus;
  total: number;
  done: number;
  failCount: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
  isCancelled: boolean;
}

interface TransferState {
  jobs: TransferJob[];
  addJob: (job: Omit<TransferJob, 'createdAt' | 'updatedAt' | 'isCancelled'>) => TransferJob;
  updateJob: (id: string, updates: Partial<TransferJob>) => void;
  cancelJob: (id: string) => void;
  removeJob: (id: string) => void;
  getJob: (id: string) => TransferJob | undefined;
}

export const useTransferStore = create<TransferState>()((set, get) => ({
  jobs: [],

  addJob: (job) => {
    const newJob: TransferJob = {
      ...job,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCancelled: false,
    };
    set((state) => ({ jobs: [...state.jobs, newJob] }));
    return newJob;
  },

  updateJob: (id, updates) =>
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j
      ),
    })),

  cancelJob: (id) =>
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id
          ? { ...j, isCancelled: true, status: 'cancelled', updatedAt: new Date().toISOString() }
          : j
      ),
    })),

  removeJob: (id) =>
    set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) })),

  getJob: (id) => get().jobs.find((j) => j.id === id),
}));
