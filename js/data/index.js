/* ================= 数据层汇总入口（js/data/index.js） =================
 * **必须是最后一个加载的数据文件**。职责只有两件事：
 *   1. 按 js/data/manifest.js 的顺序把各域注册进 `KUP.DATA`；
 *   2. 跑一次跨域一致性校验（角色↔武器↔形态↔支援↔Boss↔商店），有问题就 warn。
 *
 * 调试：
 *   KUP.DATA.audit()        // 重新校验，返回问题数组
 *   KUP.DATA.provider('FORMS')  // 查某段数据由哪个域提供
 *   node tools/inventory.js // 会打印模块数与校验结果
 * ================================================================ */
(function (KUP) {
  if (!KUP || !KUP.DATA || typeof KUP.DATA.finalize !== 'function') {
    console.warn('[KUP][data] 未找到 KUP.DATA：请确认 js/data/core.js 在 index.js 之前加载。');
    return;
  }
  KUP.DATA.finalize();
})(window.KUP);
