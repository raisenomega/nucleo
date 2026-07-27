// BC hr — biblioteca de capacitación (recursos + vínculo a cursos). Puro.
export type ResResult = { ok: true } | { ok: false; error: string };
export type ResourceType = "document" | "video" | "link" | "image" | "presentation";
export type VideoProvider = "youtube" | "vimeo" | "bunny" | "other";

export interface Resource {
  readonly id: string; readonly title: string; readonly description: string | null;
  readonly resourceType: ResourceType;
  readonly fileUrl: string | null; readonly fileName: string | null; readonly fileSize: number | null; readonly fileMime: string | null;
  readonly videoUrl: string | null; readonly videoProvider: VideoProvider | null; readonly externalUrl: string | null;
  readonly category: string | null; readonly tags: readonly string[]; readonly isPublic: boolean;
  readonly isRequired?: boolean;  // presente al venir de un curso
}
export interface ResourceInput {
  title: string; description: string; resourceType: ResourceType; category: string; tags: string[]; isPublic: boolean;
  fileUrl?: string | null; fileName?: string | null; fileSize?: number | null; fileMime?: string | null;
  videoUrl?: string | null; externalUrl?: string | null;
}

export interface IResourceRepository {
  library(): Promise<Resource[]>;
  courseResources(courseId: string): Promise<Resource[]>;
  create(input: ResourceInput): Promise<ResResult>;
  update(id: string, input: Partial<ResourceInput>): Promise<ResResult>;
  remove(id: string): Promise<ResResult>;
  linkToCourse(courseId: string, resourceId: string, required: boolean): Promise<ResResult>;
  unlinkFromCourse(courseId: string, resourceId: string): Promise<ResResult>;
  uploadFile(tenantId: string, resourceId: string, file: File): Promise<string | null>;
  signUrl(path: string): Promise<string | null>;
}
