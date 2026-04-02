<script setup lang="ts">
const props = defineProps<{
  lists: {
    title: string;
    link: {
      slug: string;
      title: string;
    }[];
  }[];
}>();
</script>

<template>
  <div class="footer">
    <nav class="footer__links">
      <div
        class="footer_list-container"
        v-for="(list, listIndex) in props.lists"
        :key="`footer-list-${listIndex}`"
      >
        <h3>{{ list.title }}</h3>
        <ul>
          <li v-for="link in list.link" :key="link.slug">
            <a :href="link.slug" class="footer__link">{{ link.title }}</a>
          </li>
        </ul>
      </div>
    </nav>
  </div>
</template>
