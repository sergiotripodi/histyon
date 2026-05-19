export interface Patient {
  id:             string;
  doctor_id:      string;
  first_name:     string;
  last_name:      string;
  fiscal_code:    string;
  date_of_birth:  string;
  gender:         'M' | 'F' | 'OTHER';
  email?:         string;
  phone_number?:  string;
  address_street?: string;
  address_civic?:  string;
  city?:          string;
  province?:      string;
  postal_code?:   string;
  country?:       string;
  place_of_birth?: string;
  created_at:     string;
}

export interface AiResults {
  summary?: {
    percentuale_tessuto_malato?: number;
    area_totale?:               number;
    counts?: {
      glomeruli?:             number;
      glomeruli_sclerotici?:  number;
      tubuli_prossimali?:     number;
      tubuli_distali?:        number;
    };
  };
}

export interface AnnotationFeature {
  type:       'Feature';
  geometry: {
    type:        'Polygon' | 'MultiPolygon' | 'Point' | 'LineString';
    coordinates: number[][][] | number[][] | number[];
  };
  properties?: {
    label?:      string;
    confidence?: number;
    class?:      string;
    [key: string]: unknown;
  };
}

export interface Annotations {
  type:      'FeatureCollection';
  features:  AnnotationFeature[];
}

export interface Ticket {
  id:           string;
  patient_id:   string;
  doctor_id:    string;
  status:       'UPLOADING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  results?:     AiResults;
  annotations?: Annotations;
  ai_metadata?: Record<string, unknown>;
  notes?:       string;
  created_at:   string;
  updated_at?:  string;
  patients?:    Pick<Patient, 'first_name' | 'last_name'> | Pick<Patient, 'first_name' | 'last_name'>[];
}
