window.KUP = window.KUP || {};

/* ================= 渲染层（从 game.js 拆分） =================
 * - 背景/网格/街区/雾/边界 + 每区主题装饰（P0 #8 地图辨识度）：
 *   参番街＝温室／田垄、伍番街＝烟囱、肆番街＝锈迹骨架、陸番街＝残骸
 * - 渲染绝不消费 U.rng（保持可复现性）；装饰形状由 buildCity 确定性生成
 */
(function () {
  const U = KUP.U, C = KUP.CONFIG;

  const RenderMixin = {
    render(t) {
      const ctx = this.ctx, v = this.view;
      if (!this._bgGrad || this._bgGradH !== v.h) {
        const g = ctx.createLinearGradient(0, 0, 0, v.h);
        g.addColorStop(0, '#0d0722'); g.addColorStop(0.55, '#0a0618'); g.addColorStop(1, '#0d0a24');
        this._bgGrad = g; this._bgGradH = v.h;
      }
      if (!this._vig || this._vigW !== v.w) {
        const g = ctx.createRadialGradient(v.w / 2, v.h / 2, Math.min(v.w, v.h) * 0.42,
          v.w / 2, v.h / 2, Math.max(v.w, v.h) * 0.72);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
        this._vig = g; this._vigW = v.w;
      }
      ctx.fillStyle = this._bgGrad;
      ctx.fillRect(0, 0, v.w, v.h);

      const sx = (Math.random() - 0.5) * this.cam.shake;
      const sy = (Math.random() - 0.5) * this.cam.shake;
      ctx.save();
      ctx.translate(-this.cam.x + sx, -this.cam.y + sy);

      this.drawGrid(ctx);
      this.drawCity(ctx, t);
      this.drawFog(ctx);

      for (const g of this.gems) g.draw(ctx, t);
      for (const z of this.zones) z.draw(ctx, t);
      for (const ts of this.tosses) ts.draw(ctx, t);
      /* 纯表现层（冲击波等）：画在滞留区之上、弹幕之下 */
      for (const f of this.fx) f.draw(ctx, t);
      for (const r of this.rings) r.draw(ctx, t);
      for (const sl of this.slashes) sl.draw(ctx, t);
      for (const b of this.beams) b.draw(ctx, t);
      for (const e of this.enemies) e.draw(ctx, t);
      /* 敌方攻击画在敌人**之上**：预警与判定必须一眼可见（高对比斜纹／虚线／倒计时「!」） */
      for (const d of this.dangers) d.draw(ctx, t);
      if (this.player) {
        this.player.draw(ctx, t);
        for (const w of this.player.weapons) w.drawOrbs(ctx, this.player);
      }
      /* v0.20：召唤物（虚言）画在玩家之后、弹幕之前 */
      for (const sm of this.summons || []) sm.draw(ctx, t);
      /* v0.13.6：弹体密集时关掉每个弹体的 shadowBlur（canvas 阴影＝独立模糊 pass，
       * 400 弹体时单帧 render 会冲到 15ms+ ⇒ 卡顿）。阈值 140：
       * 正常游玩基本触不到，治安战高波次才降级为「实心弹体」。 */
      const projGlow = this.projs.length <= 140;
      for (const pr of this.projs) pr.draw(ctx, t, projGlow);
      for (const pt of this.parts) pt.draw(ctx);
      for (const tx of this.texts) tx.draw(ctx);
      this.drawBounds(ctx);

      ctx.restore();

      ctx.fillStyle = this._vig;
      ctx.fillRect(0, 0, v.w, v.h);
    },

    drawGrid(ctx) {
      const step = 120, v = this.view;
      const x0 = Math.floor(this.cam.x / step) * step;
      const y0 = Math.floor(this.cam.y / step) * step;
      ctx.strokeStyle = 'rgba(110,90,220,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = x0; x <= this.cam.x + v.w + step; x += step) {
        ctx.moveTo(x, this.cam.y); ctx.lineTo(x, this.cam.y + v.h);
      }
      for (let y = y0; y <= this.cam.y + v.h + step; y += step) {
        ctx.moveTo(this.cam.x, y); ctx.lineTo(this.cam.x + v.w, y);
      }
      ctx.stroke();
    },

    drawCity(ctx, t) {
      const v = this.view, cx = this.cam.x, cy = this.cam.y;
      const deco = this.city.deco || {};
      // 田垄（参番街·farm）
      if (deco.rows) {
        ctx.fillStyle = 'rgba(70,140,90,0.30)';
        for (const r of deco.rows) {
          if (r.x + r.w < cx - 40 || r.x > cx + v.w + 40 || r.y + r.h < cy - 40 || r.y > cy + v.h + 40) continue;
          ctx.fillRect(r.x, r.y, r.w, r.h);
        }
      }
      // 温室（参番街·farm）
      if (deco.green) {
        for (const g of deco.green) {
          if (g.x + g.w < cx - 40 || g.x > cx + v.w + 40 || g.y + g.h < cy - 40 || g.y > cy + v.h + 40) continue;
          ctx.fillStyle = 'rgba(140,220,160,0.10)';
          ctx.strokeStyle = 'rgba(140,220,160,0.35)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(g.x, g.y + g.h);
          ctx.quadraticCurveTo(g.x + g.w / 2, g.y - g.h * 0.5, g.x + g.w, g.y + g.h);
          ctx.closePath();
          ctx.fill(); ctx.stroke();
        }
      }
      // 街区楼体
      for (const b of this.city.blocks) {
        if (b.x + b.w < cx - 40 || b.x > cx + v.w + 40 || b.y + b.h < cy - 40 || b.y > cy + v.h + 40) continue;
        ctx.fillStyle = b.tone || 'rgba(16,10,36,0.92)';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = 'hsla(' + b.hue + ',80%,65%,0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
        ctx.strokeStyle = 'hsla(' + b.hue + ',90%,72%,0.8)';
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.w, b.y); ctx.stroke();
        if (b.win) {
          ctx.fillStyle = 'hsla(' + b.hue + ',70%,70%,0.28)';
          for (let wx = b.x + 10; wx < b.x + b.w - 8; wx += 22) {
            for (let wy = b.y + 10; wy < b.y + b.h - 8; wy += 22) ctx.fillRect(wx, wy, 5, 7);
          }
        }
      }
      // 锈迹骨架（肆番街·ruins）：楼体顶端锯齿残破轮廓
      if (deco.broken) {
        ctx.lineWidth = 1.4;
        for (const k of deco.broken) {
          if (k.x + k.w < cx - 40 || k.x > cx + v.w + 40 || k.y < cy - 40 || k.y > cy + v.h + 40) continue;
          ctx.strokeStyle = 'hsla(' + k.hue + ',70%,60%,0.5)';
          ctx.beginPath();
          const seg = 6;
          ctx.moveTo(k.x, k.y);
          for (let i = 1; i <= seg; i++) {
            const f = i / seg;
            const dip = Math.sin(k.seed * 40 + i * 2.7) * 8 + 3;
            ctx.lineTo(k.x + k.w * f, k.y + (i % 2 === 0 ? dip : dip * 0.4));
          }
          ctx.stroke();
        }
      }
      // 烟囱（伍番街·industry）：楼顶细高烟囱 + 红色警示灯
      if (deco.chimneys) {
        for (const ch of deco.chimneys) {
          if (ch.x < cx - 40 || ch.x > cx + v.w + 40 || ch.y - ch.h < cy - 40 || ch.y > cy + v.h + 40) continue;
          ctx.fillStyle = 'rgba(30,20,14,0.95)';
          ctx.fillRect(ch.x, ch.y - ch.h, ch.w, ch.h);
          ctx.strokeStyle = 'hsla(' + ch.hue + ',60%,55%,0.5)';
          ctx.lineWidth = 1;
          ctx.strokeRect(ch.x + 0.5, ch.y - ch.h + 0.5, ch.w - 1, ch.h - 1);
          if (Math.sin(t * 3 + ch.x * 0.1) > 0.55) {
            ctx.fillStyle = 'rgba(255,70,70,0.9)';
            ctx.beginPath(); ctx.arc(ch.x + ch.w / 2, ch.y - ch.h - 2, 1.8, 0, U.TAU); ctx.fill();
          }
        }
      }
      // 残骸（陸番街·restricted）
      if (deco.debris) {
        for (const d of deco.debris) {
          if (d.x < cx - 40 || d.x > cx + v.w + 40 || d.y < cy - 40 || d.y > cy + v.h + 40) continue;
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.rot);
          ctx.fillStyle = 'rgba(100,90,130,0.4)';
          ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
          ctx.restore();
        }
      }
      // 漂浮字符（视差）
      const px = cx * 0.72, py = cy * 0.72, span = 2200;
      ctx.textAlign = 'center';
      for (const g of this.city.glyphs) {
        const gx = ((g.x - px) % span + span) % span - 100;
        const gy = ((g.y - py) % span + span) % span - 100;
        if (gx > v.w + 100 || gy > v.h + 100) continue;
        ctx.save();
        ctx.translate(gx, gy); ctx.rotate(g.rot);
        ctx.globalAlpha = g.a;
        ctx.fillStyle = '#8fd0ff';
        ctx.font = g.size + 'px sans-serif';
        ctx.fillText(g.ch, 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    },

    /* 街区雾气：覆盖可视世界区域（章节演出 fog 事件与「深霧空間」都会临时加深） */
    drawFog(ctx) {
      const boost = this.fogBoostT > 0 ? (this.fogBoost || 0) : 0;
      const f = (this.area.fog || 0) + boost + (this.spaceFog || 0);
      if (f <= 0) return;
      ctx.fillStyle = 'rgba(10,8,22,' + Math.min(0.75, f).toFixed(3) + ')';
      ctx.fillRect(this.cam.x, this.cam.y, this.view.w, this.view.h);
    },

    drawBounds(ctx) {
      const A = C.ARENA;
      ctx.strokeStyle = 'rgba(255,90,200,0.5)';
      ctx.lineWidth = 4;
      ctx.setLineDash([26, 14]);
      ctx.strokeRect(0, 0, A, A);
      ctx.setLineDash([]);
    },
  };

  /* 混入 Game 原型（game.js 先于本文件加载） */
  if (KUP.Game) Object.assign(KUP.Game.prototype, RenderMixin);
  KUP.RenderMixin = RenderMixin;
})();
