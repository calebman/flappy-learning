let debounceTimeout: any = null;
/**
 * 防抖函数
 * @param fun 函数执行丢下
 * @param wait 等待时间ms
 */
export function debounce(fn: any, wait: number) {
  if (debounceTimeout) { clearTimeout(debounceTimeout); }
  debounceTimeout = setTimeout(fn, wait);
}
