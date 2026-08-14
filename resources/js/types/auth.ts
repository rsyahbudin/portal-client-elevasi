/** Info sesi Portal Client — bukan akun, cuma cakupan PIN yang sedang aktif di session. */
export type PortalShared = {
    scope: 'project' | 'work_site' | null;
    label: string | null;
    viewer_name: string | null;
};
