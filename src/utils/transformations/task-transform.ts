import { Task } from "../../App";

// Convert ONE API item → Task
export function mapApiItemToTask(item: any): Task {
  return {
    id: item._id ?? "",

    orderId:
      item.orderStageTrackingObjId?.orderVariantObjId?.orderObjId?.modelId ??
      "N/A",

    orderStageId: item.orderStageTrackingObjId?._id ?? "",

    taskId: item.orderTaskId ?? "",
    factory: item.orderStageTrackingObjId?.factoryOrgId?.name ?? "",

    product:
      `${item.orderStageTrackingObjId?.orderVariantObjId?.orderObjId?.productType ?? ""} ` +
      `${item.orderStageTrackingObjId?.orderVariantObjId?.orderObjId?.productClass ?? ""} ` +
      `${item.orderStageTrackingObjId?.orderVariantObjId?.orderObjId?.productSubclass ?? ""}`
        .trim() || "N/A",

    stage: item.orderStageTrackingObjId?.stageName ?? "",
    stageStatus: item.orderStageTrackingObjId?.stageStatus ?? "",

    status: item.status ?? "Pending",
    taskType: item.taskType ?? "",

    dueDate: item.dueDate ?? "",
    priority: item.priority ?? "",

    photos: item.pictures?.map((p: any) => p.url) ?? [],
    comments: item.remarks ?? "",
    submissionData: undefined,

    isOverdue: !!item.dueDate && new Date(item.dueDate) < new Date(),
    isSubmitted: item.status === "Accepted",
    isCompleted: item.status === "Completed",
    isRejected: item.status === "Rejected",
  };
}

// Convert array of API items → Task[]
export function mapApiResponseToTasks(apiData: any[]): Task[] {
  return apiData.map(mapApiItemToTask);
}
