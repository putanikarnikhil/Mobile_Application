import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface TaskCardProps {
  task: TaskItem;
  onSelectTask: (task: TaskItem) => void;
}

export interface TaskItem {
  orderId: string;
  taskId: string;
  factory: string;
  productType: string;
  productClass: string;
  productSubclass: string;
  stageName: string;
  dueDate: string; // ISO date string
  priority: "Low" | "Medium" | "High";
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onSelectTask }) => {
  return (
    <TouchableOpacity onPress={() => onSelectTask(task)}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.orderId}>Order: {task.orderId}</Text>
          <View
            style={[styles.priorityBadge, styles[`priority_${task.priority}`]]}
          >
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
        </View>

        <Text style={styles.taskId}>Task ID: {task.taskId}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Factory:</Text>
          <Text style={styles.value}>{task.factory}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Product:</Text>
          <Text style={styles.value}>
            {task.productType} • {task.productClass} • {task.productSubclass}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Stage:</Text>
          <Text style={styles.value}>{task.stageName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Due Date:</Text>
          <Text style={styles.value}>
            {new Date(task.dueDate).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default TaskCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 10,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  taskId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 12,
  },

  section: {
    marginBottom: 6,
  },

  label: {
    fontSize: 13,
    color: "#999",
  },

  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  // Priority Badge
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },

  priority_Low: { backgroundColor: "#4CAF50" },
  priority_Medium: { backgroundColor: "#FF9800" },
  priority_High: { backgroundColor: "#F44336" },
});
