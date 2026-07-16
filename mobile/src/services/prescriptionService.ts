import api from './api';

export interface ExtractedMedicine {
  name: string;
  dosage?: string;
  frequency?: string;
  duration_days?: number;
  suggested_times?: string[];
  suggested_days?: string;
  suggested_label?: string;
}

export interface PrescriptionScanResult {
  doctor_name?: string;
  prescription_date?: string;
  medicines: ExtractedMedicine[];
}

export interface Prescription {
  id: number;
  profile_id: number;
  name: string;
  doctor_name?: string;
  prescription_date?: string;
  image_path?: string;
  ai_extracted_json?: string;
  is_active: boolean;
  created_at: string;
  medication_count: number;
}

export interface PrescriptionAlert {
  prescription_id: number;
  prescription_name: string;
  doctor_name?: string;
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  suggested_times?: string[];
  suggested_days?: string;
  suggested_label?: string;
}

export const prescriptionService = {
  /** Scan a prescription image or PDF using AI */
  async scan(file: {uri: string; type: string; name: string}): Promise<PrescriptionScanResult> {
    const formData = new FormData();
    formData.append('file', file as any);
    const res = await api.post('/scan/prescription', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
    return res.data;
  },

  /** Save a prescription record to the backend */
  async save(
    profileId: number,
    data: {
      name: string;
      doctor_name?: string;
      prescription_date?: string;
      ai_extracted_json?: string;
    },
    file?: {uri: string; type: string; name: string},
  ): Promise<Prescription> {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.doctor_name) formData.append('doctor_name', data.doctor_name);
    if (data.prescription_date) formData.append('prescription_date', data.prescription_date);
    if (data.ai_extracted_json) formData.append('ai_extracted_json', data.ai_extracted_json);
    if (file) formData.append('file', file as any);
    const res = await api.post(`/prescriptions/${profileId}`, formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
    return res.data;
  },

  /** Get all prescriptions for a profile */
  async getAll(profileId: number, activeOnly = false): Promise<Prescription[]> {
    const res = await api.get(`/prescriptions/${profileId}`, {
      params: {active_only: activeOnly},
    });
    return res.data;
  },

  /** Get a single prescription detail */
  async getOne(prescriptionId: number): Promise<Prescription> {
    const res = await api.get(`/prescriptions/detail/${prescriptionId}`);
    return res.data;
  },

  /** Toggle active/inactive */
  async toggle(prescriptionId: number): Promise<{id: number; is_active: boolean}> {
    const res = await api.patch(`/prescriptions/${prescriptionId}/toggle`);
    return res.data;
  },

  /** Delete a prescription */
  async delete(prescriptionId: number): Promise<void> {
    await api.delete(`/prescriptions/${prescriptionId}`);
  },

  /** Get medicines from active prescriptions not yet in schedule */
  async getAlerts(profileId: number): Promise<{alerts: PrescriptionAlert[]; count: number}> {
    const res = await api.get(`/prescriptions/${profileId}/alerts/unscheduled`);
    return res.data;
  },

  /** Parse AI JSON string from a prescription */
  parseScanResult(jsonStr?: string): PrescriptionScanResult | null {
    if (!jsonStr) return null;
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  },
};
