export type ConsultationType = "FIRST_VISIT" | "FOLLOW_UP" | "ROUTINE";

export const CONSULTATION_TYPE_LABELS: Record<ConsultationType, string> = {
    FIRST_VISIT: "Primeira Consulta",
    FOLLOW_UP: "Retorno",
    ROUTINE: "Rotina",
};

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
