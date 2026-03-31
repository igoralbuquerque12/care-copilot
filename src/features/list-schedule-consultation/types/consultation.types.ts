export type { ConsultationType } from "~/types/consultation";
export { CONSULTATION_TYPE_LABELS } from "~/types/consultation";

export type ConsultationItem = {
    id: string;
    date: Date;
    type: ConsultationType;
    patient: {
        id: string;
        name: string;
        cpf?: string | null;
    };
    anamnesis?: { id: string } | null;
};

export type ChartEntry = {
    date: string;
    count: number;
};

export type PaginatedConsultations = {
    items: ConsultationItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    pageCount: number; // Added alias for compatibility if needed, but keeping consistent with original
};
