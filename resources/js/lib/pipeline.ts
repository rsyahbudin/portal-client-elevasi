/**
 * Tahap pipeline yang boleh dilihat klien — cermin dari
 * `Project::CLIENT_SAFE_STAGES` di ERP (`app/Models/Project.php`).
 *
 * PENTING — kenapa whitelist ini harus ada DI SINI juga, bukan cuma di ERP:
 * endpoint `GET /api/v1/projects` mengirim `pipeline_stage` lewat
 * `CLIENT_SAFE_FIELDS`, dan nilainya TIDAK difilter di sana (yang difilter
 * ketat cuma endpoint `/pipeline`). Jadi proyek yang sedang berada di tahap
 * komersial akan benar-benar mengirim 'rab' / 'anwijzing' / 'penawaran' /
 * 'nego' / 'spk' ke portal ini. Tahap-tahap itu membawa konteks harga dan
 * negosiasi yang tidak boleh pernah sampai ke mata klien.
 *
 * Sifatnya DEFAULT-DENY: tahap apa pun yang tidak terdaftar di bawah
 * ditampilkan sebagai "Persiapan" dan tidak memajukan indikator progres.
 * Tahap baru di ERP tidak otomatis bocor — harus ditambahkan eksplisit.
 */
export const CLIENT_SAFE_STAGES = [
    'survey',
    'layout',
    'desain_3d',
    'pelaksanaan',
    'pengujian',
    'serah_terima',
] as const;

export type ClientSafeStage = (typeof CLIENT_SAFE_STAGES)[number];

const STAGE_LABELS: Record<ClientSafeStage, string> = {
    survey: 'Survey',
    layout: 'Layout',
    desain_3d: 'Desain 3D',
    pelaksanaan: 'Pelaksanaan',
    pengujian: 'Pengujian',
    serah_terima: 'Serah Terima',
};

export interface StageProgress {
    /** Label siap tampil. Selalu aman diekspos ke klien. */
    label: string;
    /** Posisi tahap, 1-based. `0` berarti belum masuk tahap yang boleh dilihat klien. */
    step: number;
    total: number;
    /** Proyek sudah sampai serah terima. */
    isComplete: boolean;
}

export function resolveStageProgress(
    stage: string | null | undefined,
): StageProgress {
    const total = CLIENT_SAFE_STAGES.length;
    const index = CLIENT_SAFE_STAGES.indexOf(stage as ClientSafeStage);

    if (index === -1) {
        return { label: 'Persiapan', step: 0, total, isComplete: false };
    }

    return {
        label: STAGE_LABELS[CLIENT_SAFE_STAGES[index]],
        step: index + 1,
        total,
        isComplete: CLIENT_SAFE_STAGES[index] === 'serah_terima',
    };
}
