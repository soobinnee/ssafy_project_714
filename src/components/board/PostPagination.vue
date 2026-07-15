<template>
  <div class="pagination-container">
    <div class="pagination">
      <!-- 이전 버튼 -->
      <button
        class="pagination-btn pagination-prev"
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
      >
        이전
      </button>

      <!-- 페이지 번호 버튼들 -->
      <button
        v-for="page in pageNumbers"
        :key="page"
        class="pagination-btn pagination-number"
        :class="{ active: page === currentPage }"
        @click="changePage(page)"
      >
        {{ page }}
      </button>

      <!-- 다음 버튼 -->
      <button
        class="pagination-btn pagination-next"
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
      >
        다음
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PostPagination',
  props: {
    currentPage: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
      required: true
    }
  },
  emits: ['change'],
  computed: {
    pageNumbers() {
      const pages = [];
      const maxButtons = 5; // 최대 5개 페이지 버튼 표시
      
      // 시작 페이지 계산
      let start = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
      let end = Math.min(this.totalPages, start + maxButtons - 1);
      
      // 끝 페이지가 totalPages보다 작으면 시작 페이지 조정
      if (end - start + 1 < maxButtons) {
        start = Math.max(1, end - maxButtons + 1);
      }
      
      // 페이지 번호 생성
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    }
  },
  methods: {
    changePage(page) {
      // 범위 체크 및 현재 페이지와 다를 때만 emit
      if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
        this.$emit('change', page);
      }
    }
  }
}
</script>

<style scoped>
.pagination-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 30px;
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

/* 기본 버튼 스타일 */
.pagination-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  min-width: 36px;
  height: 36px;
}

/* 버튼 호버 */
.pagination-btn:hover:not(:disabled) {
  background-color: #f0f0f0;
  border-color: #007bff;
  color: #007bff;
}

/* 활성 페이지 (현재 페이지) */
.pagination-btn.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
  font-weight: 600;
}

.pagination-btn.active:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

/* 비활성 버튼 (이전/다음) */
.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.pagination-btn:disabled:hover {
  background-color: #f5f5f5;
  border-color: #ddd;
  color: inherit;
}

/* 이전/다음 버튼 */
.pagination-prev,
.pagination-next {
  font-weight: 600;
  min-width: 50px;
}

/* 페이지 번호 버튼 */
.pagination-number {
  min-width: 36px;
  text-align: center;
}

/* 반응형 - 태블릿 */
@media (max-width: 768px) {
  .pagination-btn {
    padding: 6px 10px;
    font-size: 13px;
    min-width: 32px;
    height: 32px;
  }

  .pagination-prev,
  .pagination-next {
    min-width: 45px;
  }
}

/* 반응형 - 모바일 */
@media (max-width: 480px) {
  .pagination {
    gap: 6px;
  }

  .pagination-btn {
    padding: 6px 8px;
    font-size: 12px;
    min-width: 28px;
    height: 28px;
  }

  .pagination-prev,
  .pagination-next {
    min-width: 40px;
    font-size: 12px;
  }
}
</style>