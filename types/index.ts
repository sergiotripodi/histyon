export interface Patient {
  id: string;
  doctor_id: string;
  first_name: string;
  last_name: string;
  fiscal_code: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'OTHER';
  email?: string;
  phone_number?: string;
  address_street?: string;
  address_civic?: string;
  city?: string;
  province?: string;
  region?: string;
  postal_code?: string;
  country?: string;
  place_of_birth?: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  patient_id: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  image_url: string; 
  created_at: string;
  output_dzi_url?: string;   
  project_file_url?: string; 
  ai_results?: {
    summary?: {
      percentuale_tessuto_malato?: number;
      area_totale?: number;
      counts?: {
        glomeruli?: number;
        glomeruli_sclerotici?: number;
        tubuli_prossimali?: number;
        tubuli_distali?: number;
      };
    };
  };
}