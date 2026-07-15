<template>
  <div class="category-card" @click="handleSelect">
    <div class="card-image">
      <span class="card-emoji">{{ icon }}</span>
    </div>
    <div class="card-label">{{ label }}</div>
  </div>
</template>

<script>
export default {
  name: 'CategoryCard',
  props: {
    icon: String,
    label: String,
    category: String
  },
  emits: ['select'],
  methods: {
    handleSelect() {
      this.$emit('select', this.category);
    }
  }
}
</script>

<style scoped>
.category-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
}

.category-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.card-image {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-emoji {
  font-size: 48px;
  line-height: 1;
}

.card-label {
  padding: 12px;
  text-align: center;
  font-weight: 600;
  background: white;
  font-size: 14px;
}

/* 반응형 */
@media (max-width: 480px) {
  .card-emoji {
    font-size: 36px;
  }

  .card-label {
    padding: 10px;
    font-size: 13px;
  }
}
</style>