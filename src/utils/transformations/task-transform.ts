// utils/transformations/task-transform.ts
import { Task, SubmissionData } from "../../App";

export function mapApiItemToTask(item: any): Task {
  return {
    id: item._id ?? "",
    orderId:
      item.orderStageTrackingObjId?.orderVariantObjId?.orderObjId?.modelId ??
      "N/A",
    orderStageId: item.orderStageTrackingObjId?._id ?? "",
    taskId: item.orderTaskId ?? "",
    factory: item.orderStageTrackingObjId?.factoryOrgId?.name ?? "N/A",
    product:
      (
        `${item.orderStageTrackingObjId?.orderVariantObjId?.orderObjId?.productType ?? ""} ` +
        `${item.orderStageTrackingObjId?.orderVariantObjId?.orderObjId?.productClass ?? ""} ` +
        `${item.orderStageTrackingObjId?.orderVariantObjId?.orderObjId?.productSubclass ?? ""}`
      ).trim() || "N/A",

    stage: item.orderStageTrackingObjId?.stageName ?? "",
    stageStatus: item.orderStageTrackingObjId?.stageStatus ?? "pending",

    taskType: item.taskType || "",
    status: item.status || "Pending",
    priority: item.priority || "",

    dueDate: item.dueDate,
    completedOn: item.completedOn ?? null,

    address: item.address ?? null,
    remarks: item.remarks ?? null,
    rejectionReason: item.rejectionReason ?? null,

    photos: item.pictures?.map((p: any) => p.url) ?? [],
    comments: item.remarks ?? "",

    isOverdue: !!item.dueDate && new Date(item.dueDate) < new Date(),
    isSubmitted: item.status === "Accepted",
    isCompleted: item.status === "Completed",
    isRejected: item.status === "Rejected",
  };
}


export const mapApiResponseToTasks = (apiData: any[]): Task[] =>
  apiData.map(mapApiItemToTask);
