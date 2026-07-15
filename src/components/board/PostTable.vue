<template>
  <div class="post-table-container">
    <table class="post-table" v-if="posts.length > 0">
      <thead>
        <tr>
          <th class="col-number">번호</th>
          <th class="col-title">제목</th>
          <th class="col-author">작성자</th>
          <th class="col-date">작성일</th>
          <th class="col-views">조회수</th>
          <th class="col-likes">좋아요</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="(post, index) in posts" 
          :key="post.id"
          @click="handleSelectPost(post.id)"
          class="post-row"
        >
          <td class="col-number">{{ posts.length - index }}</td>
          <td class="col-title">{{ post.title }}</td>
          <td class="col-author">{{ post.author }}</td>
          <td class="col-date">{{ formatDate(post.createdAt) }}</td>
          <td class="col-views">{{ post.views }}</td>
          <td class="col-likes">{{ post.likes }}</td>
        </tr>
      </tbody>
    </table>

    <!-- 빈 데이터 메시지 -->
    <div v-else class="no-posts">
      <p>게시글이 없습니다.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PostTable',
  props: {
    posts: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  emits: ['select'],
  methods: {
    handleSelectPost(postId) {
      this.$emit('select', postId);
    },
    formatDate(timestamp) {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
}
</script>

<style scoped>
.post-table-container {
  width: 100%;
  overflow-x: auto;
}

/* 테이블 기본 스타일 */
.post-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 테이블 헤더 */
.post-table thead {
  background-color: #f5f5f5;
  border-bottom: 2px solid #ddd;
}

.post-table th {
  padding: 15px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

/* 컬럼 너비 조정 */
.col-number {
  width: 8%;
  text-align: center;
}

.col-title {
  width: 45%;
  text-align: left;
}

.col-author {
  width: 15%;
  text-align: center;
}

.col-date {
  width: 15%;
  text-align: center;
}

.col-views {
  width: 8%;
  text-align: center;
}

.col-likes {
  width: 9%;
  text-align: center;
}

/* 테이블 바디 */
.post-table tbody tr {
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.post-table tbody tr:hover {
  background-color: #f9f9f9;
}

.post-table td {
  padding: 12px;
  font-size: 14px;
  color: #666;
}

.post-table .col-number,
.post-table .col-author,
.post-table .col-date,
.post-table .col-views,
.post-table .col-likes {
  text-align: center;
}

/* 제목 스타일 */
.post-table .col-title {
  color: #007bff;
  font-weight: 500;
}

.post-table tbody tr:hover .col-title {
  text-decoration: underline;
}

/* 빈 데이터 메시지 */
.no-posts {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
}

.no-posts p {
  margin: 0;
}

/* 반응형 - 태블릿 */
@media (max-width: 768px) {
  .post-table th,
  .post-table td {
    padding: 10px 8px;
    font-size: 13px;
  }

  .col-number {
    width: 8%;
  }

  .col-title {
    width: 40%;
  }

  .col-author {
    width: 15%;
  }

  .col-date {
    width: 15%;
  }

  .col-views {
    width: 8%;
  }

  .col-likes {
    width: 9%;
  }
}

/* 반응형 - 모바일 */
@media (max-width: 480px) {
  .post-table-container {
    overflow-x: auto;
  }

  .post-table {
    min-width: 600px;
  }

  .post-table th,
  .post-table td {
    padding: 8px 6px;
    font-size: 12px;
  }

  .col-number {
    width: 10%;
  }

  .col-title {
    width: 35%;
  }

  .col-author {
    width: 15%;
  }

  .col-date {
    width: 15%;
  }

  .col-views {
    width: 12%;
  }

  .col-likes {
    width: 13%;
  }

  .no-posts {
    padding: 40px 20px;
    font-size: 14px;
  }
}
</style>