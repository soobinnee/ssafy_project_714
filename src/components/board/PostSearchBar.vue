<template>
  <div class="search-bar">
    <input 
      v-model="searchQuery"
      type="text" 
      placeholder="게시글 검색..."
      @keyup.enter="handleSearch"
      class="search-input"
    />
    <button @click="handleSearch" class="search-btn">검색</button>
  </div>
</template>

<script>
export default {
  name: 'PostSearchBar',
  data() {
    return {
      searchQuery: ''
    }
  },
  emits: ['search'],
  methods: {
    handleSearch() {
      if (this.searchQuery.trim()) {
        this.$emit('search', this.searchQuery.trim());
        this.searchQuery = ''; // 검색 후 입력창 비우기
      }
    }
  }
}
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  width: 100%;
}

.search-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.search-btn {
  padding: 10px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s ease;
  white-space: nowrap;
}

.search-btn:hover {
  background: #0056b3;
}

.search-btn:active {
  transform: scale(0.98);
}

/* 모바일 반응형 */
@media (max-width: 480px) {
  .search-bar {
    gap: 6px;
    margin-bottom: 15px;
  }

  .search-input {
    font-size: 13px;
    padding: 8px 10px;
  }

  .search-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
}
</style>