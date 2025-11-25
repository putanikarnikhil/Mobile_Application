import { Task } from "../../App";
import { ColorConstants, styles } from "../../AppStyles";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Image,
  ViewStyle,
} from "react-native";

interface TaskCardProps {
  task: Task;
  onSelectTask: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onSelectTask }) => {
  const isOverdue = task.isOverdue;
  const isSubmitted = task.isSubmitted;
  const isCompleted = task.isCompleted;
  const isRejected = task.isRejected;

  let statusColor: string;
  let statusText: string;

  if (isOverdue) {
    statusColor = ColorConstants.danger;
    statusText = "Overdue";
  } else if (isSubmitted) {
    statusColor = ColorConstants.success;
    statusText = "Submitted";
  } else if (isCompleted) {
    statusColor = ColorConstants.info;
    statusText = "Completed";
  } else if (isRejected) {
    statusColor = ColorConstants.danger;
    statusText = "Rejected";
  } else {
    statusColor = ColorConstants.warning;
    statusText = "Pending Review";
  }

  const statusTagStyle: ViewStyle = {
    backgroundColor: statusColor,
  };

  return (
    <TouchableOpacity onPress={() => onSelectTask(task)}>
      <View style={[styles.card, { borderLeftColor: statusColor }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order ID: {task.orderId}</Text>
          <View style={[styles.statusTag, statusTagStyle]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardDetails}>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Factory: </Text>
              {task.factory}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Product: </Text>
              {task.product}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Stage: </Text>
              <Text style={styles.blueText}>{task.stage}</Text>
            </Text>
          </View>
          <View style={styles.cardDetails}>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Task ID: </Text>
              {task.taskId}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Task Type: </Text>
              {task.taskType}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
