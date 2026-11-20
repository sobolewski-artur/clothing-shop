<template>
  <div class="mt-8 grid animate-pulse gap-10 lg:grid-cols-[1fr_20rem]" aria-hidden="true">
    <div class="divide-y divide-stone-200 border-y border-stone-200">
      <div v-for="n in 2" :key="n" class="flex gap-4 py-5">
        <div class="h-32 w-24 rounded-lg bg-stone-200" />
        <div class="flex-1 space-y-2 pt-1">
          <div class="h-4 w-1/2 rounded bg-stone-200" />
          <div class="h-3 w-1/4 rounded bg-stone-200" />
        </div>
      </div>
    </div>
    <div class="h-48 rounded-2xl bg-stone-100" />
  </div>
</template>
