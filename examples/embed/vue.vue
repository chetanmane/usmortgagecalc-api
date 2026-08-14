<script setup>
import { onMounted, onUnmounted, ref } from "vue";

const ORIGIN = "https://www.usmortgagecalc.com";

const props = defineProps({
  state: { type: String, default: "" },
  price: { type: [String, Number], default: "" },
});

const frame = ref(null);
const height = ref(720);

// postMessage delivers from anywhere, so check the origin before trusting it.
const onMessage = (event) => {
  if (event.origin !== ORIGIN) return;
  if (event.data?.type !== "usmc:height") return;
  if (event.source !== frame.value?.contentWindow) return;

  const next = Number(event.data.height);
  if (Number.isFinite(next) && next > 0) height.value = Math.ceil(next);
};

onMounted(() => window.addEventListener("message", onMessage));
onUnmounted(() => window.removeEventListener("message", onMessage));

const src = () => {
  const params = new URLSearchParams({ utm_source: "embed" });
  if (props.state) params.set("state", props.state);
  if (props.price) params.set("price", String(props.price));
  return `${ORIGIN}/embed/calculator?${params}`;
};
</script>

<template>
  <iframe
    ref="frame"
    :src="src()"
    title="US Mortgage Calculator"
    loading="lazy"
    :style="{ width: '100%', height: height + 'px', border: 0, display: 'block' }"
  />
</template>
