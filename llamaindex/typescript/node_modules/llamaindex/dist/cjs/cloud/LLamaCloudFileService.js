"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LLamaCloudFileService", {
    enumerable: true,
    get: function() {
        return LLamaCloudFileService;
    }
});
const _api = require("@llamaindex/cloud/api");
const _utils = require("./utils.js");
class LLamaCloudFileService {
    /**
   * Get list of projects, each project contains a list of pipelines
   */ static async getAllProjectsWithPipelines() {
        (0, _utils.initService)();
        try {
            const { data: projects } = await (0, _api.listProjectsApiV1ProjectsGet)({
                throwOnError: true
            });
            const { data: pipelines } = await (0, _api.searchPipelinesApiV1PipelinesGet)({
                throwOnError: true
            });
            return projects.map((project)=>({
                    ...project,
                    pipelines: pipelines.filter((p)=>p.project_id === project.id)
                }));
        } catch (error) {
            console.error("Error listing projects and pipelines:", error);
            return [];
        }
    }
    /**
   * Upload a file to a pipeline in LlamaCloud
   */ static async addFileToPipeline(projectId, pipelineId, uploadFile, // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customMetadata = {}) {
        (0, _utils.initService)();
        const { data: file } = await (0, _api.uploadFileApiV1FilesPost)({
            query: {
                project_id: projectId
            },
            body: {
                upload_file: uploadFile
            },
            throwOnError: true
        });
        const files = [
            {
                file_id: file.id,
                custom_metadata: {
                    file_id: file.id,
                    ...customMetadata
                }
            }
        ];
        await (0, _api.addFilesToPipelineApiV1PipelinesPipelineIdFilesPut)({
            path: {
                pipeline_id: pipelineId
            },
            body: files
        });
        // Wait 2s for the file to be processed
        const maxAttempts = 20;
        let attempt = 0;
        while(attempt < maxAttempts){
            const { data: result } = await (0, _api.getPipelineFileStatusApiV1PipelinesPipelineIdFilesFileIdStatusGet)({
                path: {
                    pipeline_id: pipelineId,
                    file_id: file.id
                },
                throwOnError: true
            });
            if (result.status === "ERROR") {
                throw new Error(`File processing failed: ${JSON.stringify(result)}`);
            }
            if (result.status === "SUCCESS") {
                // File is ingested - return the file id
                return file.id;
            }
            attempt += 1;
            await new Promise((resolve)=>setTimeout(resolve, 100)); // Sleep for 100ms
        }
        throw new Error(`File processing did not complete after ${maxAttempts} attempts. Check your LlamaCloud index at https://cloud.llamaindex.ai/project/${projectId}/deploy/${pipelineId} for more details.`);
    }
    /**
   * Get download URL for a file in LlamaCloud
   */ static async getFileUrl(pipelineId, filename) {
        (0, _utils.initService)();
        const { data: allPipelineFiles } = await (0, _api.listPipelineFilesApiV1PipelinesPipelineIdFilesGet)({
            path: {
                pipeline_id: pipelineId
            },
            throwOnError: true
        });
        const file = allPipelineFiles.find((file)=>file.name === filename);
        if (!file?.file_id) return null;
        const { data: fileContent } = await (0, _api.readFileContentApiV1FilesIdContentGet)({
            path: {
                id: file.file_id
            },
            query: {
                project_id: file.project_id
            },
            throwOnError: true
        });
        return fileContent.url;
    }
}
