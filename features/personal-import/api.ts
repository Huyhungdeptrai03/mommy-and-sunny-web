import { apiClient, ApiResponse } from "@/lib/api-client";
import {
  CreatePersonalImportRequestPayload,
  PersonalImportRequestResult,
} from "@/types/personalImportRequest";

export async function createPersonalImportRequest(
  payload: CreatePersonalImportRequestPayload
): Promise<PersonalImportRequestResult> {
  const res = await apiClient.post<ApiResponse<PersonalImportRequestResult>>(
    "/personal-import-requests",
    payload
  );
  return res.data.data;
}

// Không set Content-Type thủ công — axios tự nhận diện FormData và để trình duyệt
// tự tính boundary multipart chính xác, set tay sẽ làm hỏng phần boundary
export async function uploadPersonalImportImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<ApiResponse<{ url: string }>>("/uploads/image", formData);
  return res.data.data.url;
}
