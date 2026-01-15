<template>
  <div v-if="show" class="node-detail-modal" @click.self="handleClose">
    <div class="node-detail-card">
      <div class="detail-header">
        <h4>航点详情</h4>
        <button class="close-btn" @click="handleClose">
          ×
        </button>
      </div>
      <div class="detail-body">
        <div class="detail-row">
          <label>名称:</label>
          <input
            v-model="editData.id"
            type="text"
            disabled
            class="input-disabled"
          />
        </div>
        <div class="detail-row">
          <label>位置 X:</label>
          <input v-model.number="editData.pose.position.x" type="number" step="0.01" />
        </div>
        <div class="detail-row">
          <label>位置 Y:</label>
          <input v-model.number="editData.pose.position.y" type="number" step="0.01" />
        </div>
        <div class="detail-divider"></div>
        <div class="detail-row">
          <label>航向角 (Yaw):</label>
          <input v-model.number="yaw" type="number" step="1" />
          <span class="unit">度</span>
        </div>
        <div class="detail-divider"></div>
        <div class="detail-row neighbors-row">
          <label>后继节点:</label>
          <div class="neighbors-list">
            <span v-for="neighbor in editData.neighbors" :key="neighbor" class="neighbor-tag">
              {{ neighbor }}
              <button class="remove-neighbor" @click="handleRemoveNeighbor(neighbor)">×</button>
            </span>
            <span v-if="!editData.neighbors.length" class="no-neighbors">无</span>
          </div>
        </div>
        <div class="detail-row">
          <label>添加后继:</label>
          <select v-model="newNeighborId" class="neighbor-select">
            <option value="">
              选择节点...
            </option>
            <option v-for="neighborNodeId in availableNeighborsList" :key="neighborNodeId" :value="neighborNodeId">
              {{ neighborNodeId }}
            </option>
          </select>
          <button class="add-neighbor-btn" :disabled="!newNeighborId" @click="handleAddNeighbor">
            添加
          </button>
        </div>
      </div>
      <div class="detail-footer">
        <button class="btn btn-secondary" @click="handleClose">
          取消
        </button>
        <button class="btn btn-danger" @click="handleDelete">
          删除节点
        </button>
        <button class="btn btn-primary" @click="handleSave">
          保存修改
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NodeEditDialog',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    nodeId: {
      type: String,
      default: ''
    },
    nodeData: {
      type: Object,
      default: null
    },
    allNodes: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'save', 'delete', 'add-neighbor', 'remove-neighbor'],
  data() {
    return {
      editData: {
        id: '',
        pose: {
          position: { x: 0, y: 0, z: 0 },
          orientation: { x: 0, y: 0, z: 0, w: 1 }
        },
        neighbors: []
      },
      yaw: 0,
      newNeighborId: ''
    };
  },
  computed: {
    availableNeighborsList() {
      if (!this.editData.id) {
        return [];
      }
      return Object.keys(this.allNodes).filter(
        id => id !== this.editData.id && !this.editData.neighbors.includes(id)
      );
    }
  },
  watch: {
    nodeData: {
      handler(newData) {
        if (newData) {
          // 深拷贝节点数据
          this.editData = {
            id: this.nodeId,
            pose: {
              position: { ...newData.pose.position },
              orientation: { ...newData.pose.orientation }
            },
            neighbors: [...(newData.neighbors || [])]
          };
          // 将四元数转换为yaw角度
          this.yaw = this.quaternionToYaw(newData.pose.orientation);
        }
      },
      immediate: true,
      deep: true
    },
    yaw(newYaw) {
      // 当yaw改变时，更新四元数
      this.editData.pose.orientation = this.yawToQuaternion(newYaw);
    }
  },
  methods: {
    // 四元数转yaw角度（单位：度）
    quaternionToYaw(q) {
      // 计算yaw: atan2(2*(q.w*q.z + q.x*q.y), 1 - 2*(q.y*q.y + q.z*q.z))
      const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
      const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
      const yawRad = Math.atan2(siny_cosp, cosy_cosp);
      // 转换为角度
      return (yawRad * 180 / Math.PI).toFixed(1) * 1;
    },

    // yaw角度转四元数
    yawToQuaternion(yawDeg) {
      // 将角度转换为弧度
      const yawRad = yawDeg * Math.PI / 180;
      // 只有yaw的四元数 (roll=0, pitch=0)
      return {
        x: 0,
        y: 0,
        z: Math.sin(yawRad / 2),
        w: Math.cos(yawRad / 2)
      };
    },

    handleClose() {
      this.newNeighborId = '';
      this.$emit('close');
    },

    handleSave() {
      // 发送保存的数据，包含转换后的四元数
      this.$emit('save', {
        id: this.editData.id,
        pose: {
          position: {
            x: this.editData.pose.position.x,
            y: this.editData.pose.position.y,
            z: this.editData.pose.position.z
          },
          orientation: this.editData.pose.orientation
        },
        neighbors: this.editData.neighbors
      });
    },

    handleDelete() {
      this.$emit('delete', this.editData.id);
    },

    handleAddNeighbor() {
      if (this.newNeighborId) {
        this.$emit('add-neighbor', this.newNeighborId);
        this.newNeighborId = '';
      }
    },

    handleRemoveNeighbor(neighborId) {
      this.$emit('remove-neighbor', neighborId);
    }
  }
};
</script>

<style scoped>
.node-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.node-detail-card {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.detail-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.detail-row label {
  min-width: 120px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.detail-row input[type="text"],
.detail-row input[type="number"] {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.detail-row input[type="text"]:focus,
.detail-row input[type="number"]:focus {
  outline: none;
  border-color: #3b82f6;
}

.input-disabled {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

.unit {
  margin-left: 8px;
  color: #6b7280;
  font-size: 14px;
}

.detail-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 20px 0;
}

.neighbors-row {
  align-items: flex-start;
}

.neighbors-list {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.neighbor-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 12px;
  font-size: 13px;
}

.remove-neighbor {
  background: none;
  border: none;
  color: #1e40af;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.remove-neighbor:hover {
  background: #bfdbfe;
}

.no-neighbors {
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
}

.neighbor-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s;
}

.neighbor-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.add-neighbor-btn {
  margin-left: 8px;
  padding: 8px 16px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-neighbor-btn:hover:not(:disabled) {
  background: #2563eb;
}

.add-neighbor-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.detail-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  justify-content: flex-end;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
}

.btn-primary:hover {
  background: #2563eb;
}
</style>
