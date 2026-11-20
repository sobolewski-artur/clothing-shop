<template>
  <footer class="border-t border-stone-200 bg-stone-50">
    <div class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-stone-500 sm:flex-row sm:justify-between">
      <p>© {{ new Date().getFullYear() }} {{ $t('brand') }}. {{ $t('footer.rights') }}</p>
      <p>{{ $t('footer.photos') }}</p>
    </div>
  </footer>
</template>
