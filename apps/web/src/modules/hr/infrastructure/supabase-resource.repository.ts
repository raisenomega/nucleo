import { supabase } from "@shared/lib/supabase";
import type { IResourceRepository, Resource, ResourceInput, ResResult } from "@hr/domain/resource.types";

const ok = (e: { message: string } | null): ResResult => (e ? { ok: false, error: e.message } : { ok: true });
type Row = Record<string, unknown>;
const toRes = (r: Row): Resource => ({
  id: r.id as string, title: r.title as string, description: (r.description as string) ?? null,
  resourceType: r.resource_type as Resource["resourceType"],
  fileUrl: (r.file_url as string) ?? null, fileName: (r.file_name as string) ?? null,
  fileSize: r.file_size != null ? Number(r.file_size) : null, fileMime: (r.file_mime as string) ?? null,
  videoUrl: (r.video_url as string) ?? null, videoProvider: (r.video_provider as Resource["videoProvider"]) ?? null,
  externalUrl: (r.external_url as string) ?? null, category: (r.category as string) ?? null,
  tags: Array.isArray(r.tags) ? (r.tags as string[]) : [], isPublic: !!r.is_public, isRequired: r.is_required as boolean | undefined,
});
const toData = (i: Partial<ResourceInput>) => ({
  title: i.title, description: i.description, resource_type: i.resourceType, category: i.category,
  tags: i.tags, is_public: i.isPublic, file_url: i.fileUrl, file_name: i.fileName, file_size: i.fileSize,
  file_mime: i.fileMime, video_url: i.videoUrl, external_url: i.externalUrl,
});

export const supabaseResourceRepository: IResourceRepository = {
  async library(): Promise<Resource[]> {
    const { data } = await supabase.rpc("get_resource_library");
    return ((data as Row[] | null) ?? []).map(toRes);
  },
  async courseResources(courseId): Promise<Resource[]> {
    const { data } = await supabase.rpc("get_course_resources", { p_course_id: courseId });
    return ((data as Row[] | null) ?? []).map(toRes);
  },
  async create(input): Promise<ResResult> { return ok((await supabase.rpc("create_training_resource", { p_data: toData(input) })).error); },
  async update(id, input): Promise<ResResult> { return ok((await supabase.rpc("update_training_resource", { p_id: id, p_data: toData(input) })).error); },
  async remove(id): Promise<ResResult> { return ok((await supabase.rpc("delete_training_resource", { p_id: id })).error); },
  async linkToCourse(courseId, resourceId, required): Promise<ResResult> {
    return ok((await supabase.rpc("link_resource_to_course", { p_course_id: courseId, p_resource_id: resourceId, p_is_required: required })).error);
  },
  async unlinkFromCourse(courseId, resourceId): Promise<ResResult> {
    return ok((await supabase.rpc("unlink_resource_from_course", { p_course_id: courseId, p_resource_id: resourceId })).error);
  },
  async uploadFile(tenantId, resourceId, file): Promise<string | null> {
    const path = `${tenantId}/resources/${resourceId}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("training-media").upload(path, file, { upsert: true });
    return error ? null : path;
  },
  async signUrl(path): Promise<string | null> {
    const { data } = await supabase.storage.from("training-media").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  },
};
