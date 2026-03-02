import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

type CreateScheduleConsultationInput = {
    patientId?: string;
    newPatient?: {
        name: string;
        birthDate: Date;
        gender: "Masculino" | "Feminino" | "Outro";
        cpf?: string;
    };
    date: string;
    type: "FIRST_VISIT" | "FOLLOW_UP" | "ROUTINE";
};

export const createScheduleConsultation = async (
    db: PrismaClient,
    profileId: string,
    input: CreateScheduleConsultationInput,
) => {
    try {
        let patientId = input.patientId;

        if (!patientId) {
            if (!input.newPatient) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Informe o paciente ou preencha os dados de novo paciente",
                });
            }

            const created = await db.patient.create({
                data: {
                    name: input.newPatient.name,
                    birthDate: input.newPatient.birthDate,
                    gender: input.newPatient.gender,
                    cpf: input.newPatient.cpf,
                    profileId,
                },
            });
            patientId = created.id;
        } else {
            const patient = await db.patient.findFirst({
                where: { id: patientId, profileId },
            });
            if (!patient) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Paciente não encontrado",
                });
            }
        }

        const dateUtc = new Date(input.date);

        return await db.scheduleConsultation.create({
            data: {
                patientId,
                profileId,
                date: dateUtc,
                type: input.type,
            },
            include: {
                patient: {
                    select: { id: true, name: true },
                },
            },
        });
    } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[ScheduleConsultation - create]: ", error);
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao criar agendamento",
        });
    }
};

export const listConsultationsByDate = async (
    db: PrismaClient,
    profileId: string,
    dateStr: string,
) => {
    try {
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

        return await db.scheduleConsultation.findMany({
            where: {
                profileId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            orderBy: { date: "asc" },
            include: {
                patient: {
                    select: { id: true, name: true },
                },
            },
        });
    } catch (error) {
        console.error("[ScheduleConsultation - listByDate]: ", error);
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao listar agendamentos do dia",
        });
    }
};

export const listConsultationsPaginated = async (
    db: PrismaClient,
    profileId: string,
    dateStr: string,
    page: number,
    pageSize: number,
) => {
    try {
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

        const [total, items] = await Promise.all([
            db.scheduleConsultation.count({
                where: { profileId, date: { gte: startOfDay, lte: endOfDay } },
            }),
            db.scheduleConsultation.findMany({
                where: { profileId, date: { gte: startOfDay, lte: endOfDay } },
                orderBy: { date: "asc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    patient: { select: { id: true, name: true, cpf: true } },
                    anamnesis: { select: { id: true } },
                },
            }),
        ]);

        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    } catch (error) {
        console.error("[ScheduleConsultation - listPaginated]: ", error);
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao listar agendamentos",
        });
    }
};

export const getChartData = async (
    db: PrismaClient,
    profileId: string,
    days: number,
) => {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const results: { date: string; count: number }[] = [];

        for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setUTCDate(d.getUTCDate() + i);
            const dateStr = d.toISOString().split("T")[0]!;
            const start = new Date(`${dateStr}T00:00:00.000Z`);
            const end = new Date(`${dateStr}T23:59:59.999Z`);

            const count = await db.scheduleConsultation.count({
                where: { profileId, date: { gte: start, lte: end } },
            });

            results.push({ date: dateStr, count });
        }

        return results;
    } catch (error) {
        console.error("[ScheduleConsultation - chartData]: ", error);
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao carregar dados do gráfico",
        });
    }
};

export const updateConsultation = async (
    db: PrismaClient,
    profileId: string,
    id: string,
    data: { date?: string; type?: "FIRST_VISIT" | "FOLLOW_UP" | "ROUTINE" },
) => {
    try {
        const existing = await db.scheduleConsultation.findFirst({
            where: { id, profileId },
        });
        if (!existing) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Consulta não encontrada" });
        }

        return await db.scheduleConsultation.update({
            where: { id },
            data: {
                ...(data.date ? { date: new Date(data.date) } : {}),
                ...(data.type ? { type: data.type } : {}),
            },
            include: { patient: { select: { id: true, name: true, cpf: true } } },
        });
    } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[ScheduleConsultation - update]: ", error);
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao atualizar consulta",
        });
    }
};

export const deleteConsultation = async (
    db: PrismaClient,
    profileId: string,
    id: string,
) => {
    try {
        const existing = await db.scheduleConsultation.findFirst({
            where: { id, profileId },
        });
        if (!existing) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Consulta não encontrada" });
        }

        return await db.scheduleConsultation.delete({ where: { id } });
    } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[ScheduleConsultation - delete]: ", error);
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao excluir consulta",
        });
    }
};
