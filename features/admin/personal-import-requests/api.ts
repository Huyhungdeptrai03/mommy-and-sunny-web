import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import {
  AdminPersonalImportRequest,
  PersonalImportRequestStatus,
} from "@/types/adminPersonalImportRequest";

export async function getAdminPersonalImportRequests(
  status?: PersonalImportRequestStatus
): Promise<PagedResult<AdminPersonalImportRequest>> {
  const res = await apiClient.get<ApiResponse<PagedResult<AdminPersonalImportRequest>>>(
    "/admin/personal-import-requests",
    { params: status ? { status } : undefined }
  );
  return res.data.data;
}

export async function updateAdminPersonalImportRequestStatus(
  id: string,
  payload: { status: PersonalImportRequestStatus; adminNote?: string }
): Promise<AdminPersonalImportRequest> {
  const res = await apiClient.patch<ApiResponse<AdminPersonalImportRequest>>(
    `/admin/personal-import-requests/${id}/status`,
    payload
  );
  return res.data.data;
}
