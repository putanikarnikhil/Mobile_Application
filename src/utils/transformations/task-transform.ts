import { TaskItem } from "../../components/tasks/TasksCard";

// Convert ONE API item → TaskItem
export function mapApiItemToTask(item: any): TaskItem {
  return {
    orderId:
      item.orderStageTrackingObjId?.orderVariantObjId?.orderObjId?.modelId ??
      "",
    taskId: item.orderTaskId ?? "",
    factory: item.orderStageTrackingObjId?.factoryOrgId?.name ?? "",
    productType:
      item.orderStageTrackingObjId?.orderVariantObjId?.orderObjId
        ?.productType ?? "",
    productClass:
      item.orderStageTrackingObjId?.orderVariantObjId?.orderObjId
        ?.productClass ?? "",
    productSubclass:
      item.orderStageTrackingObjId?.orderVariantObjId?.orderObjId
        ?.productSubclass ?? "",
    stageName: item.orderStageTrackingObjId?.stageName ?? "",
    dueDate: item.dueDate ?? "",
    priority: item.priority ?? "",
  };
}

// Convert array of API items → TaskItem[]
export function mapApiResponseToTasks(apiData: any[]): TaskItem[] {
  return apiData.map(mapApiItemToTask);
}
