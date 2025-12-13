// services/update-task-status.ts
import api from "./api";
import { log } from "../config/logger-config";
import { LocationData } from "../App";

export interface UpdateTaskPayload {
  status?: "Pending" | "Completed" | "Accepted" | "Rejected";
  remarks?: string;
  rejectionReason?: string;
  address?: {
    latitude: number;
    longitude: number;
    fullAddress: string;
  };
  pictures?: Array<{
    url: string;
    caption?: string;
    uploadedAt?: Date;
  }>;
}

/**
 * Updates task status and metadata
 */
export const updateTaskStatus = async (
  taskId: string,
  payload: UpdateTaskPayload
): Promise<any> => {
  try {
    log.debug(`📤 Updating task ${taskId}`, payload);

    const response = await api.put(`/task/update/${taskId}`, payload);

    if (response.data.success) {
      log.debug(`✅ Task ${taskId} updated successfully`);
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Task update failed");
    }
  } catch (error: any) {
    log.error("❌ Update task error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Uploads audit images to the task
 */
export const uploadTaskPictures = async (
  taskId: string,
  imageUris: string[]
): Promise<string[]> => {
  try {
    if (!imageUris || imageUris.length === 0) {
      log.warn("⚠️ No images to upload");
      return [];
    }

    log.debug(`📤 Uploading ${imageUris.length} images for task ${taskId}`);

    const formData = new FormData();

    // Convert each image URI to a file blob and append to FormData
    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      
      // Extract filename from URI or generate one
      const filename = uri.split("/").pop() || `audit-image-${Date.now()}-${i}.jpg`;
      
      // Create file object for React Native
      const file: any = {
        uri: uri,
        type: "image/jpeg", // Adjust if you support other formats
        name: filename,
      };

      formData.append("auditImage", file);
    }

    const response = await api.post(`/task/uploadPictures/${taskId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 seconds for image uploads
    });

    if (response.data.success) {
      log.debug(`✅ Uploaded ${response.data.uploadedCount} images successfully`);
      
      // Extract URLs from response
      const uploadedUrls = response.data.data.map((pic: any) => pic.url);
      return uploadedUrls;
    } else {
      throw new Error(response.data.message || "Image upload failed");
    }
  } catch (error: any) {
    log.error("❌ Upload pictures error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Complete workflow: Upload images, then update task with location and remarks
 */
export const submitTaskWithImagesAndLocation = async (
  taskId: string,
  imageUris: string[],
  remarks: string,
  location: LocationData,
  status: "Completed" | "Rejected" = "Completed"
): Promise<any> => {
  try {
    log.debug(`🚀 Starting task submission for ${taskId}`);

    // Step 1: Upload images first
    let uploadedPictureUrls: string[] = [];
    
    if (imageUris.length > 0) {
      log.debug(`📸 Uploading ${imageUris.length} images...`);
      uploadedPictureUrls = await uploadTaskPictures(taskId, imageUris);
      log.debug(`✅ Images uploaded: ${uploadedPictureUrls.length} URLs`);
    } else {
      log.warn("⚠️ No images to upload");
    }

    // Step 2: Update task with status, remarks, and location
    log.debug("📝 Updating task status and metadata...");
    
    const updatePayload: UpdateTaskPayload = {
      status: status,
      remarks: remarks || "Task submitted",
      address: {
        latitude: location.latitude,
        longitude: location.longitude,
        fullAddress: location.address,
      },
      // Include uploaded picture URLs (backend will append to existing)
      pictures: uploadedPictureUrls.map(url => ({
        url,
        caption: "",
        uploadedAt: new Date(),
      })),
    };

    const updatedTask = await updateTaskStatus(taskId, updatePayload);

    log.debug("✅ Task submission completed successfully");

    return {
      success: true,
      task: updatedTask,
      uploadedImages: uploadedPictureUrls.length,
    };

  } catch (error: any) {
    log.error("❌ Task submission failed:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Submit task rejection with reason
 */
export const rejectTask = async (
  taskId: string,
  rejectionReason: string,
  location: LocationData
): Promise<any> => {
  try {
    log.debug(`❌ Rejecting task ${taskId}`);

    const payload: UpdateTaskPayload = {
      status: "Rejected",
      rejectionReason: rejectionReason || "Task rejected by auditor",
      remarks: rejectionReason || "Task rejected by auditor",
      address: {
        latitude: location.latitude,
        longitude: location.longitude,
        fullAddress: location.address,
      },
    };

    const updatedTask = await updateTaskStatus(taskId, payload);

    log.debug("✅ Task rejected successfully");

    return {
      success: true,
      task: updatedTask,
    };

  } catch (error: any) {
    log.error("❌ Task rejection failed:", error.response?.data || error.message);
    throw error;
  }
};