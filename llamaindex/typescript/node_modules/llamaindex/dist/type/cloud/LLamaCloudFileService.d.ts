export declare class LLamaCloudFileService {
    /**
     * Get list of projects, each project contains a list of pipelines
     */
    static getAllProjectsWithPipelines(): Promise<{
        pipelines: import("@llamaindex/cloud/api").Pipeline[];
        name: string;
        id: string;
        created_at?: string | null;
        updated_at?: string | null;
        ad_hoc_eval_dataset_id?: string | null;
        organization_id: string;
        is_default?: boolean;
    }[]>;
    /**
     * Upload a file to a pipeline in LlamaCloud
     */
    static addFileToPipeline(projectId: string, pipelineId: string, uploadFile: File | Blob, customMetadata?: Record<string, any>): Promise<string>;
    /**
     * Get download URL for a file in LlamaCloud
     */
    static getFileUrl(pipelineId: string, filename: string): Promise<string | null>;
}
