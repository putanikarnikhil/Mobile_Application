import { Task } from "../../App";

export function mapApiItemToTask(item: any): Task {
  return {
    id: item._id ?? "",
    orderId: item.orderStageTrackingObjId?.orderVariantObjId?.orderObjId?.modelId ?? "N/A",
    orderStageId: item.orderStageTrackingObjId?._id ?? "",
    taskId: item.orderTaskId ?? "",
    factory: item.orderStageTrackingObjId?.factoryOrgId?.name ?? "N/A",

    product: item.orderStageTrackingObjId?.orderVariantObjId?.orderObjId?.productType ??
      "N/A",

    stage: item.orderStageTrackingObjId?.stageName ?? "N/A",
    stageStatus: item.orderStageTrackingObjId?.stageStatus ?? "pending",

    taskType: item.taskType ?? "N/A",
    status: item.status ?? "Pending",
    priority: item.priority ?? "",

    dueDate: item.dueDate,

    completedOn: item.completedOn ?? null,
    remarks: item.remarks ?? null,
    rejectionReason: item.rejectionReason ?? null,

    address: item.address ?? null,

    photos: item.pictures?.map((p: any) => p.url) ?? [],
    comments: item.remarks ?? "",

    isOverdue: !!item.dueDate && new Date(item.dueDate) < new Date(),
    isSubmitted: item.status === "Accepted",
    isCompleted: item.status === "Completed",
    isRejected: item.status === "Rejected",
  };
}
